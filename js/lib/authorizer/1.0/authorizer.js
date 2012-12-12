/* Facebook Web Clients 1.0 */

ensurePackage("guardian.facebook");
(function () {

    if (guardian.facebook.Authorizer) {
        return;
    }

    var instance = null;

    /**
     * Provides a means for client scripts to access the Facebook API and authenticate users.
     * @constructor
     */
    function Authorizer() {
        instance = this;
        this.onConnected = new RepeatablePromise();
        this.onFBScriptLoaded = new RepeatablePromise();
        this.onUserDataLoaded = new RepeatablePromise();
        this.onNotAuthorized = new RepeatablePromise();
        this.onNotLoggedIn = new RepeatablePromise();
    }

    /**
     * The default set of permissions to request
     * @type {{scope: string}}
     */
    Authorizer.DEFAULT_PERMISSIONS = {scope: 'email,publish_actions,publish_stream'};

    /**
     * Promise like object which is resolved when the user is logged in.
     * @type {Object}
     */
    Authorizer.prototype.onConnected = null;

    /**
     * Promise like object which is resolved when the facebook script is loaded
     * @type {Object}
     */
    Authorizer.prototype.onFBScriptLoaded = null;

    /**
     * Promise like object which is resolved when the user's data is loaded (as a result
     * of a call to login() or getLoginStatus().
     * @type {Object}
     */
    Authorizer.prototype.onUserDataLoaded = null;

    /**
     * Promise like object which is resolved when the user is logged in but not authorized
     * to use the app.
     * @type {Object}
     */
    Authorizer.prototype.onNotAuthorized = null;

    /**
     * Promise like object which is resolved when the user is not logged in.
     * @type {Object}
     */
    Authorizer.prototype.onNotLoggedIn = null;

    /**
     * An access token used to authenticate the user's Facebook session. Note that at present
     * the authenticator does not handle access tokens expiring.
     * @see https://developers.facebook.com/docs/howtos/login/debugging-access-tokens/
     * @type {String}
     */
    Authorizer.accessToken = null;

    /**
     * The user's id which can be used to retrieve further data from the Facebook open graph
     * For instance you could call the following URL: https://graph.facebook.com/{userId}
     * @type {String}
     */
    Authorizer.userId = null;

    /**
     * The Facebook user data object. Includes propertiers for the user's id, name, first_name, last_name, username, gender and locale.
     * You can get the user's profile picture by substituting the username into the following call to the Graph API
     * http://graph.facebook.com/" + userData.username + "/picture
     * @see http://graph.facebook.com/btaylor
     * @type {Object}
     */
    Authorizer.userData = null;

    /**
     * Gets the user to login. This may generate a popup dialog prompting the user for their username and password.
     * To prevent popup blockers from supressing the dialog this call must be made as a direct result of a user action
     * and within the same execution scope (ie not resulting from a callback). Client methods can also subscribe to the
     * following events fired during the login process (see _handleGotLoginStatus)
     *
     * @see https://developers.facebook.com/docs/reference/javascript/FB.login/
     * @param {Object} permissions The permissions to send to the FB.login() call
     * @return A promise which is resolved once the user has been authenticated and authorized the Guardian app
     */
    Authorizer.prototype.login = function (permissions) {
        if (!this.accessToken) {
            this._loadFacebookAPI().then(function (FB) {
                FB.login(this._handleGotLoginStatus.bind(this), permissions || Authorizer.DEFAULT_PERMISSIONS);
            }.bind(this))
        }
        return this.onConnected;
    };

    /**
     * Checks whether the user is logged in and has authorised the app. Returns a promise which is resolved
     * when the user is full connected and authenticated for the app.Client methods can also subscribe to the
     * following events fired during the login process (see _handleGotLoginStatus)
     *
     * @see https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus/
     * @return A promise which is resolved when the user has been authenticated and authorized the Guardian app
     */
    Authorizer.prototype.getLoginStatus = function (permissions) {
        if (!this.loginStatusPending) {
            this.loginStatusPending = true;
            this._loadFacebookAPI().then(function (FB) {
                FB.getLoginStatus(this._handleGotLoginStatus.bind(this), permissions || Authorizer.DEFAULT_PERMISSIONS);
            }.bind(this));
        }
        return this.onConnected;
    };

    /**
     * Gets the Facebook APP id for the relevent guardian app. It will first check
     * window.identity.facebook.appId.
     *
     * If this is not present, then it will extract the from the fb:app_id meta tag on the page.
     * Note that the meta tag always displays the production app id, so is not correct in preproduction environments.
     *
     * @private
     */
    Authorizer.prototype.getAppId = function () {
        var identityId = window.identity && identity.facebook && identity.facebook.appId,
            metaTag = document.querySelector && document.querySelector("meta[property='fb:app_id']");
        return identityId || metaTag && metaTag.content;
    };

    /* End of public methods */

    var scriptId = 'facebook-jssdk';

    /**
     * Called when the user logs in or checks login status. If the user is fully auth'd to use the app, then
     * it will resolve the authorized promise. It will also trigger one of the following events
     *
     * Authorizer.AUTHORIZED: Triggered when the user is not signed into their account
     * Authorizer.NOT_LOGGED_IN: Triggered when the user is not signed into their account
     * Authorizer.NOT_AUTHORIZED: Triggered when the user signed into their account but has not authorised the app
     *
     * If the user is logged in, the Authorizer will also fetch user data (see _handleGotUserData)
     *
     * @param response The response from facebook following a call to getLoginStatus or getLogin.
     * @private
     */
    Authorizer.prototype._handleGotLoginStatus = function (response) {
        this.loginStatusPending = false;
        switch (response.status) {
            case 'connected':
                this.accessToken = response.authResponse.accessToken;
                this.userId = response.authResponse.userID;
                this._getUserData();
                this.onConnected.resolve(FB);
                break;
            case 'not_authorized':
                this._getUserData();
                this.onNotAuthorized.resolve(this);
                break;
            default:
                this.onNotLoggedIn.resolve();
        }

    };

    /**
     * Fetches data about the user. When this is complete it triggers the following:
     * Authorizer.GOT_USER_DETAILS: Which includes a single parameter with the userData JSON
     * This data is also made available as a field on the authorizer.
     */
    Authorizer.prototype._getUserData = function () {
        FB.api("/me", this._handleGotUserData.bind(this));
    };

    /**
     * Called when the Facebook API returns data about the user
     * @param {Object} data The data from the server
     * @private
     */
    Authorizer.prototype._handleGotUserData = function (data) {
        if (data && !data.error) {
            this.userData = data;
            this.onUserDataLoaded.resolve(data);
        }
    };

    /**
     * Loads the Facebook API. Not intended for direct use: call the function you intend to use (login or getloginstatus)
     * and these will load the facebook api or use the existing version as required.
     * @private
     */
    Authorizer.prototype._loadFacebookAPI = function () {
        if (window.FB) {
            this.onFBScriptLoaded.resolve(window.FB);
        } else if (!document.getElementById(scriptId) && !this._requiredAlready) {
            this._requiredAlready = true;
            this._loadFacebookScript();
        }
        return this.onFBScriptLoaded;
    };

    /**
     * Loads the Facebook script using RequireJS or Curl JS
     * @private
     */
    Authorizer.prototype._loadFacebookScript = function () {
        var scriptLoader = require || curl;
        scriptLoader(['//connect.facebook.net/en_US/all.js'], this._handleScriptLoaded.bind(this))
    };

    /**
     * Called when the Facebook script is loaded.
     * @private
     */
    Authorizer.prototype._handleScriptLoaded = function () {

        FB.init({
            appId: this.getAppId(),
            channelUrl: '//' + document.location.host + ':' + document.location.port + '/channel.html',
            status: true, // check login status
            cookie: true, // enable cookies to allow the server to access the session
            xfbml: true  // parse XFBML
        });

        this.onFBScriptLoaded.resolve(FB);

    };

    /**
     * Destroys the instance allowing a new authorizer to be created. Useful for testing.
     */
    Authorizer.prototype.destroy = function () {
        instance = null;
    };

    function RepeatablePromise() {
        this.callbacks = [];
    }

    RepeatablePromise.prototype.invalidate = function () {
        this.args = undefined;
    };

    RepeatablePromise.prototype.resolve = function () {
        this.args = Array.prototype.slice.apply(arguments);
        var i, numCallbacks = this.callbacks.length;
        for (i = 0; i < numCallbacks; i++) {
            this.callbacks[i].apply(null, this.args);
        }
    };

    RepeatablePromise.prototype.then = function (fn) {
        this.callbacks.push(fn);
        if (this.args !== undefined) {
            fn.apply(null, this.args);
        }
    };

    guardian.facebook.Authorizer = {
        getInstance: function () {
            return instance || new Authorizer();
        }
    }

})();


/**
 * Live / local overrides — API + Google OAuth origins
 */
(function () {
    var host = location.hostname;
    var path = location.pathname || '/';
    var isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

    if (!window.NEXWEB_API_BASE && isLocalHost) {
        var idx = path.indexOf('/project/');
        window.NEXWEB_API_BASE = idx >= 0 ? path.slice(0, idx) + '/backend/api' : '/backend/api';
    }

    try {
        var saved = localStorage.getItem('nexuraApiBase');
        var isPrivateApi = /localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}/i;
        if (!isLocalHost && saved && isPrivateApi.test(saved)) {
            localStorage.removeItem('nexuraApiBase');
        }
    } catch (error) {
        console.warn('Could not clear a local API override:', error);
    }

    window.NEOXWEB_GOOGLE_ORIGINS = [
        'http://localhost',
        'http://127.0.0.1',
        'https://neoxweb.netlify.app',
        'https://neo-x-web.netlify.app',
        'https://astounding-banoffee-387242.netlify.app'
    ];
})();

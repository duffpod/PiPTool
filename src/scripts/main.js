(function () {
    'use strict';

    var inPipMode,
        resources,
        currentResource,
        addPipButtons,
        findVideos,
        observer,
        observerTrigger,
        pipClickEvent,
        netflixAppendEvent,
        initPiPTool,
        togglePipMode;

    /**
     * Add the PiP event and button to a given video
     * @param {Object} videoWrapper - Video element to process
     */
    addPipButtons = function (videoWrapper) {
        var pipButton,
            pipImage,
            video,
            controlsWrapper;

        /** @type {Object} The video to be switched */
        video = videoWrapper.querySelector(currentResource.videoSelector);

        /** @type {Node} The PiP button */
        pipButton = document.createElement(currentResource.elementType);
        // noinspection JSAnnotator,JSValidateTypes
        pipButton.classList = currentResource.buttonClassList;
        pipButton.title = 'PiP Mode';

        /** @type {Node} The icon shown in the PiP button */
        pipImage = document.createElement('img');
        // noinspection JSUnresolvedVariable
        pipImage.src = safari.extension.baseURI + 'images/' + currentResource.name + '-icon.svg';
        pipImage.setAttribute('height', '100%');

        pipButton.appendChild(pipImage);

        pipButton.addEventListener('click', function (event) {
            event.preventDefault();

            /** Swap the PiP mode */
            // noinspection JSUnresolvedVariable
            if ('inline' === video.webkitPresentationMode) {
                // noinspection JSUnresolvedFunction
                video.webkitSetPresentationMode('picture-in-picture');
            } else {
                // noinspection JSUnresolvedFunction
                video.webkitSetPresentationMode('inline');
            }

            document.removeEventListener('click', pipClickEvent);

            inPipMode = false;
        });

        if (currentResource.customAppendEvent) {
            currentResource.customAppendEvent(pipButton);
        } else {
            controlsWrapper = videoWrapper.querySelector(currentResource.controlsWrapperClass);

            if (controlsWrapper && 0 === controlsWrapper.querySelectorAll('.pip-button').length) {
                controlsWrapper.appendChild(pipButton);
            }
        }
    };

    /** Find the videos according to the current resource options */
    findVideos = function () {
        var videoWrappers,
            videoWrapperIterator;

        /** Fetch all the video elements */
        videoWrappers = document.querySelectorAll(currentResource.videoParentClass);

        for (videoWrapperIterator = 0; videoWrapperIterator < videoWrappers.length; videoWrapperIterator++) {
            addPipButtons(videoWrappers[videoWrapperIterator]);
        }
    };

    /**
     * Method used to listen and trigger the event of finding the videos
     * @param {Array} mutations - Changes observed
     */
    observer = function (mutations) {
        mutations.forEach(function (mutation) {
            var addedNodesIterator;

            for (addedNodesIterator = 0; addedNodesIterator < mutation.addedNodes.length; addedNodesIterator++) {
                if (mutation.addedNodes[addedNodesIterator].classList && mutation.addedNodes[addedNodesIterator].classList.contains(currentResource.customClasses.observer)) {
                    findVideos();
                }
            }
        });
    };

    /** Create the observer */
    observerTrigger = function () {
        var observerInstance;

        /** @type {MutationObserver} Initialize an observer */
        observerInstance = new MutationObserver(observer);

        /** Set the observer */
        observerInstance.observe(document.querySelector(currentResource.customClasses.container), {
            childList: true,
            attributes: false,
            characterData: false,
            subtree: true,
            attributeOldValue: false,
            characterDataOldValue: false,
            attributeFilter: []
        });
    };

    /**
     * Click event to toggle a video's PiP mode
     * @param {MouseEvent} event - Click event received
     */
    pipClickEvent = function (event) {
        var element;

        event.preventDefault();

        element = event.target;

        // noinspection JSUnresolvedVariable
        if (element.webkitSetPresentationMode) {
            // noinspection JSUnresolvedVariable
            if ('inline' === element.webkitPresentationMode) {
                // noinspection JSUnresolvedFunction
                element.webkitSetPresentationMode('picture-in-picture');
            } else {
                // noinspection JSUnresolvedFunction
                element.webkitSetPresentationMode('inline');
            }

            togglePipMode();
        }
    };

    /** Method to toggle the hover function of PiPTool */
    togglePipMode = function () {
        if (!inPipMode) {
            document.addEventListener('click', pipClickEvent);
        } else {
            document.removeEventListener('click', pipClickEvent);
        }

        inPipMode = !inPipMode;
    };

    /**
     * Custom append event specifically for Netflix
     * @param {Node} pipButton - PiP button built previously
     */
    netflixAppendEvent = function (pipButton) {
        if (0 === document.body.querySelectorAll('.pip-button').length) {
            document.querySelector(currentResource.customClasses.buttonDestination).appendChild(pipButton);
        }
    };

    /** Method to trigger the PiP button display */
    initPiPTool = function () {
        inPipMode = false;

        // noinspection JSUnresolvedVariable
        /** Register the listener for the menu button click */
        safari.self.addEventListener('message', togglePipMode, false);

        /** @type {Array} An array with every platform and the custom options for them */
        resources = [
            {
                name: 'dailymotion',
                testPattern: /(dailymotion\.com|www\.dailymotion\.com)/,
                customLoadEvent: null,
                customAppendEvent: null,
                elementType: 'button',
                videoSelector: 'video#dmp_Video',
                buttonClassList: 'dmp_ControlBarButton pip-button',
                videoParentClass: '.dmp_Player',
                controlsWrapperClass: '.dmp_ControlBar',
                customClasses: null
            },
            {
                name: 'plex',
                testPattern: /(plex\.tv|www\.plex\.tv|app\.plex\.tv)/,
                customLoadEvent: {
                    name: 'DOMContentLoaded',
                    method: observerTrigger,
                    loaded: false
                },
                customAppendEvent: null,
                elementType: 'button',
                videoSelector: 'video.html-video',
                buttonClassList: 'btn-link pip-button',
                videoParentClass: '.video-container',
                controlsWrapperClass: '.video-controls-overlay-bottom .video-controls-right',
                customClasses: {
                    container: '#plex',
                    observer: 'video-player'
                }
            },
            {
                name: 'youtube',
                testPattern: /(youtube\.com|www\.youtube\.com|youtu\.be|www\.youtu\.be)/,
                customLoadEvent: {
                    name: 'spfdone',
                    method: findVideos,
                    loaded: false
                },
                customAppendEvent: null,
                elementType: 'button',
                videoSelector: 'video.html5-main-video',
                buttonClassList: 'ytp-button pip-button',
                videoParentClass: '.html5-video-player',
                controlsWrapperClass: '.ytp-right-controls',
                customClasses: null
            },
            {
                name: 'netflix',
                testPattern: /(netflix\.com|www\.netflix\.com)/,
                customLoadEvent: {
                    name: 'load',
                    method: observerTrigger,
                    loaded: false
                },
                customAppendEvent: netflixAppendEvent,
                elementType: 'span',
                videoSelector: 'video',
                buttonClassList: 'netflix-pip',
                videoParentClass: '.player-video-wrapper',
                customClasses: {
                    container: '#appMountPoint',
                    observer: 'player-menu',
                    buttonDestination: '.player-status'
                }
            }
        ];

        /** @type {Object} An object keeping the current platform options */
        currentResource = null;

        resources.forEach(function (resource) {
            if (location.hostname.match(resource.name)) {
                currentResource = resource;

                /** Add the event for normal pages */
                window.addEventListener('load', findVideos, true);

                /** Try to see if we have any custom handlers for this page (for instance DailyMotion). Usually these are used with SPAs (single page applications) like YouTube or Plex */
                if (null !== currentResource.customLoadEvent && false === currentResource.customLoadEvent.loaded) {
                    window.addEventListener(currentResource.customLoadEvent.name, currentResource.customLoadEvent.method, true);

                    currentResource.customLoadEvent.loaded = true;
                }
            }
        });
    };

    initPiPTool();
}());
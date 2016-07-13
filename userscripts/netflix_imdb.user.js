// ==UserScript==
// @name         New Userscript
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      https://www.netflix.com/*
// @grant        GM_xmlhttpRequest
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';

    var MYCLASS = 'hasBob';
    var MutationObserver = window.MutationObserver;
    var myObserver       = new MutationObserver (mutationHandler);
    var obsConfig        = {
        childList: true, attributes: true,
        subtree: true,   attributeFilter: ['class']
    };

    myObserver.observe (document, obsConfig);

    function mutationHandler (mutationRecords) {

        mutationRecords.forEach ( function (mutation) {

            if (    mutation.type               == "childList"
                &&  typeof mutation.addedNodes  == "object"
                &&  mutation.addedNodes.length
               ) {
                for (var J = 0, L = mutation.addedNodes.length;  J < L;  ++J) {
                    checkForCSS_Class (mutation.addedNodes[J], MYCLASS);
                }
            }
            else if (mutation.type == "attributes") {
                checkForCSS_Class (mutation.target, MYCLASS);
            }
        } );
    }

    function checkForCSS_Class (node, className) {
        //-- Only process element nodes
        if (node.nodeType === 1) {
            if (node.classList.contains (className) ) {
                var title = encodeURIComponent($.trim($(node).find('.bob-info-main .bob-title').text()));
                var year =  encodeURIComponent($.trim($(node).find('.bob-info-main .year').text()));
                var url = "https://www.omdbapi.com/?t=" + title + "&y=" + year + "&plot=short&r=json";
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    onload: function(xhr) {
                        var data = eval("(" + xhr.responseText + ")");
                        var imdbInfo = $('.imdbRating');
                        if (imdbInfo.length === 0) {
                            $('body').append('<div class="imdbRating" style="position: fixed; right: 5px; bottom: 5px; padding: 10px; background: black; color: white;"></div>');
                            imdbInfo = $('.imdbRating');
                        }
                        var el = $(MYCLASS + ' .bob-info-main .bob-title');
                        if (data && data.imdbRating) {
                            imdbInfo.html('<a href="http://www.imdb.com/title/' + data.imdbID + '">' + data.Title + ' (' + data.imdbRating + ')</a>');
                        }
                    }
                });
            }
        }
    }


})();

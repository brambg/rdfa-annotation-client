
'use strict'

import React from 'react';
import ReactDOM from 'react-dom';
import AnnotationViewer from './components/annotation/AnnotationViewer.jsx';
import RDFaUtil from './util/RDFaUtil.js';
import SelectionUtil from './util/SelectionUtil.js';
import DOMUtil from './util/DOMUtil.js';
import config from './rdfa-annotation-config.js';
import AnnotationActions from './flux/AnnotationActions.js';
const annotationAPI = config.services.AnnotationServer.api;

ReactDOM.render(
  <AnnotationViewer api={annotationAPI} pollInterval={60000} />,
  document.getElementById('annotation-viewer')
);

document.onreadystatechange = function () {
    if (document.readyState === "complete") {
        console.log("document ready!");
        startObserver();
        setAnnotationAttributes();
    }
}

var setAnnotationAttributes = function() {
    let allNodes = DOMUtil.getDescendants(document.body)
    setSelectWholeElement(allNodes);
    setUnselectable(allNodes);
}

var setSelectWholeElement = function(allNodes) {
    let selectWholeNodes = RDFaUtil.getSelectWholeNodes(allNodes);
    selectWholeNodes.forEach(function(selectWholeNode) {
        selectWholeNode.onmouseup = SelectionUtil.selectWholeElement;
    });
}

var setUnselectable = function(allNodes) {
    let ignoreNodes = RDFaUtil.getRDFaIgnoreNodes(allNodes);
    ignoreNodes.forEach(function(ignoreNode) {
        ignoreNode.style.webkitUserSelect = "none";
        ignoreNode.style.cursor = "not-allowed";
    });
}

var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        AnnotationActions.reloadAnnotations();
        setAnnotationAttributes();
    });
});

var startObserver = function() {
    var observerConfig = { childList: true, attributes: true, subtree: true };
    var observerTargets = document.getElementsByClassName("annotation-target-observer");

    for (var index = 0; index < observerTargets.length; index++) {
        observer.observe(observerTargets[index], observerConfig);
    }

}

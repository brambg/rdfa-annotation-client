/*
 * annotate-rdfa.js allows user to select RDFA-labeled text fragments
 * in RDFa enriched HTML documents.
 *
 */

// TO DO: deal with elements that have multiple types

'use strict'

import AnnotationBox from './AnnotationBox.jsx';
import AnnotationList from './AnnotationList.jsx';
import TargetSelector from './TargetSelector.jsx';
import React from 'react';
import AnnotationUtil from './../../util/AnnotationUtil.js';
import AppAnnotationStore from './../../flux/AnnotationStore';
import AnnotationActions from '../../flux/AnnotationActions.js';
import LoginBox from '../LoginBox';
import RDFaUtil from '../../util/RDFaUtil.js';

export default class AnnotationViewer extends React.Component {
    constructor(props) {
        super(props);
        this.prepareAnnotation = this.prepareAnnotation.bind(this);
        this.lookupIdentifier = this.lookupIdentifier.bind(this);
        this.topResources = [];
        this.state = {
            showAnnotationModal: false,
            user: null,
        };
    }
    componentDidMount() {
        AppAnnotationStore.bind('edit-annotation', this.editAnnotation.bind(this));
        AppAnnotationStore.bind('saved-annotation', this.loadAnnotations.bind(this));
        AppAnnotationStore.bind('changed-target', this.loadAnnotations.bind(this));
        AppAnnotationStore.bind('deleted-annotation', this.loadAnnotations.bind(this));
        AppAnnotationStore.bind('loaded-annotations', this.indexAnnotations.bind(this));

        AppAnnotationStore.bind('load-resources', this.loadResources.bind(this));

        AppAnnotationStore.bind('login-user', this.setUser.bind(this));
        AppAnnotationStore.bind('logout-user', this.setUser.bind(this));
        AppAnnotationStore.bind('registered-resources', this.loadAnnotations.bind(this));

        this.loadResources();
    }
    loadResources() {
        if (this.resourcesChanged()) {// if resources on display change, then ...
            this.resourceIndex = RDFaUtil.indexRDFaResources(); // ... refresh index
            this.maps = RDFaUtil.buildResourcesMaps(); // .. rebuild maps
        }
        console.log(this.maps);
        AnnotationActions.registerResources(this.maps);
    }
    resourcesChanged() {
        let topResources = RDFaUtil.getTopRDFaResources(document.body);
        if (this.listsAreEqual(topResources, this.topResources))
            return false;
        this.topResources = topResources; // update register resources list
        return true;
    }
    listsAreEqual(list1, list2) {
        if (list1.every(id => list2.includes(id)) &&
                list2.every(id => list1.includes(id)))
            return true;
        return false;
    }
    indexAnnotations(annotations) {
        let component = this;
        component.annotationIndex = {}; // always start with an empty index
        annotations.forEach(function(annotation) {
            component.annotationIndex[annotation.id] = annotation;
        });
        component.setState({annotations: annotations}); // add tp state AFTER indexing
    }
    loadAnnotations() {
        AnnotationActions.load(this.topResources);
    }
    lookupIdentifier(sourceId) {
        var source = { type: null, data: null }; // for IDs to external resources
        if (this.annotationIndex.hasOwnProperty(sourceId))
            source = { type: "annotation", data: this.annotationIndex[sourceId] };
        else if (this.resourceIndex.hasOwnProperty(sourceId))
            source = { type: "resource", data: this.resourceIndex[sourceId] };
        return source;
    }
    hideAnnotationForm() {
        this.setState({showAnnotationModal: false});
    }
    editAnnotation(annotation) {
        this.setState({ currentAnnotation: annotation, showAnnotationModal: true });
    }
    setUser(user) {
        this.setState({user: user});
    }
    prepareAnnotation(annotationTargets) {
        var annotation = AnnotationUtil.generateW3CAnnotation(
            this.state.user.username,
            annotationTargets
        );
        this.editAnnotation(annotation);
    }
    render() {
        return (
        <div className="annotationViewer">
            <h1>Annotation Client</h1>
            <LoginBox
                user={this.state.user}
            />
            <div>
            {this.state.user ?
                <TargetSelector
                    prepareAnnotation={this.prepareAnnotation.bind(this)}
                    annotations={this.state.annotations}
                    defaultTargets={this.props.config.defaults.target}
                    /> : null
            }
                <AnnotationList
                    currentUser={this.state.user}
                    annotations={this.state.annotations}
                    lookupIdentifier={this.lookupIdentifier.bind(this)}
                />
                <AnnotationBox
                    showModal={this.state.showAnnotationModal}
                    hideAnnotationForm={this.hideAnnotationForm.bind(this)}
                    editAnnotation={this.state.currentAnnotation}
                    currentUser={this.state.user}
                    annotationModes={this.props.config.annotationModes}
                    services={this.props.config.services}
                />
            </div>
        </div>
        );
    }
}


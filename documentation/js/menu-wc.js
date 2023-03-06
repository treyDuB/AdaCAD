'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">adacad-weaver documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/MixerModule.html" data-type="entity-link" >MixerModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-MixerModule-06a1262e19ae5dfd68cb69771516c36d47ddb7e8b5e6d183b61960f5d049b3cc47814265f14d123ec6f1f9a62821b907825d3e8095047096f4bef578dfc5b46b"' : 'data-target="#xs-components-links-module-MixerModule-06a1262e19ae5dfd68cb69771516c36d47ddb7e8b5e6d183b61960f5d049b3cc47814265f14d123ec6f1f9a62821b907825d3e8095047096f4bef578dfc5b46b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-MixerModule-06a1262e19ae5dfd68cb69771516c36d47ddb7e8b5e6d183b61960f5d049b3cc47814265f14d123ec6f1f9a62821b907825d3e8095047096f4bef578dfc5b46b"' :
                                            'id="xs-components-links-module-MixerModule-06a1262e19ae5dfd68cb69771516c36d47ddb7e8b5e6d183b61960f5d049b3cc47814265f14d123ec6f1f9a62821b907825d3e8095047096f4bef578dfc5b46b"' }>
                                            <li class="link">
                                                <a href="components/ConnectionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ConnectionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DraftdetailComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DraftdetailComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ImageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ImageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InletComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InletComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MixerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MixerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MixerViewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MixerViewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NoteComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NoteComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OpHelpModal.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OpHelpModal</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OperationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OperationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OpsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OpsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PaletteComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaletteComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ParameterComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ParameterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SnackbarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SnackbarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SubdraftComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubdraftComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-MixerModule-06a1262e19ae5dfd68cb69771516c36d47ddb7e8b5e6d183b61960f5d049b3cc47814265f14d123ec6f1f9a62821b907825d3e8095047096f4bef578dfc5b46b"' : 'data-target="#xs-directives-links-module-MixerModule-06a1262e19ae5dfd68cb69771516c36d47ddb7e8b5e6d183b61960f5d049b3cc47814265f14d123ec6f1f9a62821b907825d3e8095047096f4bef578dfc5b46b"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-MixerModule-06a1262e19ae5dfd68cb69771516c36d47ddb7e8b5e6d183b61960f5d049b3cc47814265f14d123ec6f1f9a62821b907825d3e8095047096f4bef578dfc5b46b"' :
                                        'id="xs-directives-links-module-MixerModule-06a1262e19ae5dfd68cb69771516c36d47ddb7e8b5e6d183b61960f5d049b3cc47814265f14d123ec6f1f9a62821b907825d3e8095047096f4bef578dfc5b46b"' }>
                                        <li class="link">
                                            <a href="directives/MarqueeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MarqueeComponent</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PlayerModule.html" data-type="entity-link" >PlayerModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-PlayerModule-b057e11994dd4346233188ced41005091ce031fd515e27723ed7ba2a90ec323157b7e9fe8eb5a163cbde4b3ea217f5636cb36799a5a96412a53e064459b0f8b2"' : 'data-target="#xs-components-links-module-PlayerModule-b057e11994dd4346233188ced41005091ce031fd515e27723ed7ba2a90ec323157b7e9fe8eb5a163cbde4b3ea217f5636cb36799a5a96412a53e064459b0f8b2"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-PlayerModule-b057e11994dd4346233188ced41005091ce031fd515e27723ed7ba2a90ec323157b7e9fe8eb5a163cbde4b3ea217f5636cb36799a5a96412a53e064459b0f8b2"' :
                                            'id="xs-components-links-module-PlayerModule-b057e11994dd4346233188ced41005091ce031fd515e27723ed7ba2a90ec323157b7e9fe8eb5a163cbde4b3ea217f5636cb36799a5a96412a53e064459b0f8b2"' }>
                                            <li class="link">
                                                <a href="components/OpSequencerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OpSequencerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PlaybackComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlaybackComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PlayerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlayerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/VirtualPedalsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VirtualPedalsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WeavingStateComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WeavingStateComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#components-links"' :
                            'data-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/VirtualPedalsComponent.html" data-type="entity-link" >VirtualPedalsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WeavingStateComponent.html" data-type="entity-link" >WeavingStateComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#directives-links"' :
                                'data-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/SelectionComponent.html" data-type="entity-link" >SelectionComponent</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AbstractOpFactory.html" data-type="entity-link" >AbstractOpFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseOp.html" data-type="entity-link" >BaseOp</a>
                            </li>
                            <li class="link">
                                <a href="classes/Branch.html" data-type="entity-link" >Branch</a>
                            </li>
                            <li class="link">
                                <a href="classes/Bus.html" data-type="entity-link" >Bus</a>
                            </li>
                            <li class="link">
                                <a href="classes/Cell.html" data-type="entity-link" >Cell</a>
                            </li>
                            <li class="link">
                                <a href="classes/DBListener.html" data-type="entity-link" >DBListener</a>
                            </li>
                            <li class="link">
                                <a href="classes/DBListenerArray.html" data-type="entity-link" >DBListenerArray</a>
                            </li>
                            <li class="link">
                                <a href="classes/DBNode.html" data-type="entity-link" >DBNode</a>
                            </li>
                            <li class="link">
                                <a href="classes/DBNodeArray.html" data-type="entity-link" >DBNodeArray</a>
                            </li>
                            <li class="link">
                                <a href="classes/DBTwoWay.html" data-type="entity-link" >DBTwoWay</a>
                            </li>
                            <li class="link">
                                <a href="classes/DBTwoWayArray.html" data-type="entity-link" >DBTwoWayArray</a>
                            </li>
                            <li class="link">
                                <a href="classes/DBWriteBuffer.html" data-type="entity-link" >DBWriteBuffer</a>
                            </li>
                            <li class="link">
                                <a href="classes/DBWriter.html" data-type="entity-link" >DBWriter</a>
                            </li>
                            <li class="link">
                                <a href="classes/DBWriterArray.html" data-type="entity-link" >DBWriterArray</a>
                            </li>
                            <li class="link">
                                <a href="classes/Draft.html" data-type="entity-link" >Draft</a>
                            </li>
                            <li class="link">
                                <a href="classes/Merge.html" data-type="entity-link" >Merge</a>
                            </li>
                            <li class="link">
                                <a href="classes/OnlineStatus.html" data-type="entity-link" >OnlineStatus</a>
                            </li>
                            <li class="link">
                                <a href="classes/OpSequencer.html" data-type="entity-link" >OpSequencer</a>
                            </li>
                            <li class="link">
                                <a href="classes/Params.html" data-type="entity-link" >Params</a>
                            </li>
                            <li class="link">
                                <a href="classes/PedalConfig.html" data-type="entity-link" >PedalConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/PedalStatus.html" data-type="entity-link" >PedalStatus</a>
                            </li>
                            <li class="link">
                                <a href="classes/Pipe.html" data-type="entity-link" >Pipe</a>
                            </li>
                            <li class="link">
                                <a href="classes/Render.html" data-type="entity-link" >Render</a>
                            </li>
                            <li class="link">
                                <a href="classes/Seed.html" data-type="entity-link" >Seed</a>
                            </li>
                            <li class="link">
                                <a href="classes/Selection.html" data-type="entity-link" >Selection</a>
                            </li>
                            <li class="link">
                                <a href="classes/Shape.html" data-type="entity-link" >Shape</a>
                            </li>
                            <li class="link">
                                <a href="classes/Shape-1.html" data-type="entity-link" >Shape</a>
                            </li>
                            <li class="link">
                                <a href="classes/Shuttle.html" data-type="entity-link" >Shuttle</a>
                            </li>
                            <li class="link">
                                <a href="classes/System.html" data-type="entity-link" >System</a>
                            </li>
                            <li class="link">
                                <a href="classes/Util.html" data-type="entity-link" >Util</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/InkService.html" data-type="entity-link" >InkService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LayersService.html" data-type="entity-link" >LayersService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MappingsService.html" data-type="entity-link" >MappingsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PedalsService.html" data-type="entity-link" >PedalsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PlaybackService.html" data-type="entity-link" >PlaybackService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PlayerService.html" data-type="entity-link" >PlayerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SequencerService.html" data-type="entity-link" >SequencerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ViewportService.html" data-type="entity-link" >ViewportService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/Bounds.html" data-type="entity-link" >Bounds</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Bounds-1.html" data-type="entity-link" >Bounds</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChainIndex.html" data-type="entity-link" >ChainIndex</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChainOp.html" data-type="entity-link" >ChainOp</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Crossing.html" data-type="entity-link" >Crossing</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Crossing-1.html" data-type="entity-link" >Crossing</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DensityUnits.html" data-type="entity-link" >DensityUnits</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DensityUnits-1.html" data-type="entity-link" >DensityUnits</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DesignActions.html" data-type="entity-link" >DesignActions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DesignMode.html" data-type="entity-link" >DesignMode</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DesignMode-1.html" data-type="entity-link" >DesignMode</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Draft.html" data-type="entity-link" >Draft</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Draft-1.html" data-type="entity-link" >Draft</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DraftMap.html" data-type="entity-link" >DraftMap</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DraftMap-1.html" data-type="entity-link" >DraftMap</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DraftNodeProxy.html" data-type="entity-link" >DraftNodeProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DraftNodeProxy-1.html" data-type="entity-link" >DraftNodeProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DraftOperationClassification.html" data-type="entity-link" >DraftOperationClassification</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DynamicOperation.html" data-type="entity-link" >DynamicOperation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DynamicOperation-1.html" data-type="entity-link" >DynamicOperation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Fileloader.html" data-type="entity-link" >Fileloader</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Fileloader-1.html" data-type="entity-link" >Fileloader</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileObj.html" data-type="entity-link" >FileObj</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileObj-1.html" data-type="entity-link" >FileObj</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileSaver.html" data-type="entity-link" >FileSaver</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileSaver-1.html" data-type="entity-link" >FileSaver</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Ink.html" data-type="entity-link" >Ink</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Interlacement.html" data-type="entity-link" >Interlacement</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Interlacement-1.html" data-type="entity-link" >Interlacement</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterlacementVal.html" data-type="entity-link" >InterlacementVal</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterlacementVal-1.html" data-type="entity-link" >InterlacementVal</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IOTuple.html" data-type="entity-link" >IOTuple</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IOTuple-1.html" data-type="entity-link" >IOTuple</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadResponse.html" data-type="entity-link" >LoadResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadResponse-1.html" data-type="entity-link" >LoadResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoomConfig.html" data-type="entity-link" >LoomConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoomTypes.html" data-type="entity-link" >LoomTypes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoomTypes-1.html" data-type="entity-link" >LoomTypes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MaterialTypes.html" data-type="entity-link" >MaterialTypes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MaterialTypes-1.html" data-type="entity-link" >MaterialTypes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NodeComponentProxy.html" data-type="entity-link" >NodeComponentProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NodeComponentProxy-1.html" data-type="entity-link" >NodeComponentProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NodeMethods.html" data-type="entity-link" >NodeMethods</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NodeParams.html" data-type="entity-link" >NodeParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OpClassifier.html" data-type="entity-link" >OpClassifier</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OpComponentProxy.html" data-type="entity-link" >OpComponentProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OpComponentProxy-1.html" data-type="entity-link" >OpComponentProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Operation.html" data-type="entity-link" >Operation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OperationClassification.html" data-type="entity-link" >OperationClassification</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OperationClassification-1.html" data-type="entity-link" >OperationClassification</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OperationParam.html" data-type="entity-link" >OperationParam</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OperationProperties.html" data-type="entity-link" >OperationProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OpInput.html" data-type="entity-link" >OpInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OpInput-1.html" data-type="entity-link" >OpInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PairedOp.html" data-type="entity-link" >PairedOp</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Pedal.html" data-type="entity-link" >Pedal</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PedalEvent.html" data-type="entity-link" >PedalEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlayerOp.html" data-type="entity-link" >PlayerOp</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlayerState.html" data-type="entity-link" >PlayerState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Point.html" data-type="entity-link" >Point</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Point-1.html" data-type="entity-link" >Point</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SaveObj.html" data-type="entity-link" >SaveObj</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SaveObj-1.html" data-type="entity-link" >SaveObj</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StatusMessage.html" data-type="entity-link" >StatusMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StatusMessage-1.html" data-type="entity-link" >StatusMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TopologyDef.html" data-type="entity-link" >TopologyDef</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TreeNode.html" data-type="entity-link" >TreeNode</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TreeNode-1.html" data-type="entity-link" >TreeNode</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TreeNodeProxy.html" data-type="entity-link" >TreeNodeProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TreeNodeProxy-1.html" data-type="entity-link" >TreeNodeProxy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TreeOperation.html" data-type="entity-link" >TreeOperation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Vertex.html" data-type="entity-link" >Vertex</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Vertex-1.html" data-type="entity-link" >Vertex</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ViewModes.html" data-type="entity-link" >ViewModes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ViewModes-1.html" data-type="entity-link" >ViewModes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WeavingLog.html" data-type="entity-link" >WeavingLog</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WeavingPick.html" data-type="entity-link" >WeavingPick</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WeavingPick-1.html" data-type="entity-link" >WeavingPick</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/YarnPath.html" data-type="entity-link" >YarnPath</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/YarnPath-1.html" data-type="entity-link" >YarnPath</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});
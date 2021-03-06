"use strict";
const React = require('react');
const ReactDOM = require('react-dom');

import MatchView from './components/match_view';
import EventList from './components/event_list';
import OptionsPanel from './components/options_panel';
import MatchOptions from './components/options/match_options';
import LinksPane from './components/options/links_pane';
import AudioOptions from './components/options/audio_options';

import * as audioCtx from './audio/audio_context';
import SoundManager from './audio/sound_manager';
import sineGenerator from './audio/sound_generators/chordophone_sine';
import midiGenerator from './audio/sound_generators/chordophone_midi';

import example_matches from './data/example_matches';

const matchId = "5b27a620-cebf-40a3-b09c-a37f15fd135f"

const onIos = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

/**
 * Options panel for interative.
 */
class InteractiveOptions extends React.Component {
    render() {
        return (
            <OptionsPanel>
                <MatchOptions {...this.props} />
                <AudioOptions {...this.props} />
                <LinksPane />
            </OptionsPanel>
        );
    }
}

/**
 * 
 */
class Application extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            match: null,
            
            selectedMatch: example_matches[0],
            selectedMatchId: example_matches[0].id,
            selectedAudioType: 'oscillator',
            selectedAudioSubType: 'sine',
            
            shownEvents: new Set(),
            stream: null
        };
        
        this._soundManager = new SoundManager();
    }

    componentWillMount() {
        this.setSelectedMatch(this.state.selectedMatch);
    }

    componentDidMount() {
        if (!onIos())
            audioCtx.init();

        this._soundManager.playAmbient('./sounds/spaceambient.mp3');
        this.onSelectedAudioTypeChange(this.state.selectedAudioType, this.state.selectedAudioSubType);
    }

    onTouchStart() {
        // must be created inside of a touch event
        if (onIos())
            audioCtx.init();
    }

    onEventActivate(event, data) {
        this._soundManager.play(event, Object.assign({}, data, { stream: this.state.stream }));
        this._eventCallback(event);
    }

    onSelectedMatchChange(matchId) {
        if (matchId === this.state.selectedMatchId)
            return;

        for (let x of example_matches) {
            if (x.id == matchId) {
                return this.setSelectedMatch(x);
            }
        }
    }
    
    onSelectedAudioTypeChange(type, subtype) {
        this.setState({
            selectedAudioType: type,
            selectedAudioSubType: subtype
        });
        
        if (type === 'midi') {
            this._soundManager.setGenerator(midiGenerator(subtype));
        } else {
            this._soundManager.setGenerator(sineGenerator(subtype));
        }
    }

    setSelectedMatch(match) {
        this.setState({ selectedMatch: match, selectedMatchId: match.id })
        match.match
            .then(match => {
                const shown = new Set();
                match.stream.forEach(x => shown.add(x));
                this.setState({ stream: match.stream, shownEvents: shown });
            })
            .catch(x => console.error(x))
    }

    render() {
        return (
            <div className='full-container' onTouchStart={this.onTouchStart.bind(this) }>
                <InteractiveOptions
                    onSelectedMatchChange={this.onSelectedMatchChange.bind(this)}
                    onSelectedAudioTypeChange={this.onSelectedAudioTypeChange.bind(this)}
                    selectedAudioType={this.state.selectedAudioType}
                    selectedAudioSubType={this.state.selectedAudioSubType} />
                <div className="main-view">
                    <div className='full-container'>
                        <EventList registerOnEvent={(f) => { this._eventCallback = f; } } />
                        <MatchView
                            stream={this.state.stream}
                            shownEvents={this.state.shownEvents}
                            onEventActivate={this.onEventActivate.bind(this) } />
                        <a href="http://mattbierner.github.io/Symphony-of-Death" className="page-logo" />
                    </div>
                </div>
            </div>);
    }
};

ReactDOM.render(
    <Application matchId={matchId} />,
    document.getElementById('content'));
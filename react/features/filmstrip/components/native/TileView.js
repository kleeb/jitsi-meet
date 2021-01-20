// @flow

import React, { Component } from 'react';
import {
    ScrollView,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import type { Dispatch } from 'redux';

import { Container } from '../../../base/react';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import { setTileViewDimensions } from '../../actions.native';

import LocalThumbnail from './LocalThumbnail';
import Thumbnail from './Thumbnail';
import styles from './styles';

/**
 * The type of the React {@link Component} props of {@link TileView}.
 */
type Props = {

    /**
     * Application's aspect ratio.
     */
    _aspectRatio: Symbol,

    /**
     * Application's viewport height.
     */
    _height: number,

    /**
     * The participants in the conference.
     */
    _participants: Array<Object>,

    /**
     * Application's viewport height.
     */
    _width: number,

    /**
     * Invoked to update the receiver video quality.
     */
    dispatch: Dispatch<any>,

    /**
     * Callback to invoke when tile view is tapped.
     */
    onClick: Function
};

/**
 * The margin for each side of the tile view. Taken away from the available
 * height and width for the tile container to display in.
 *
 * @private
 * @type {number}
 */
const MARGIN = 10;

/**
 * Implements a React {@link Component} which displays thumbnails in a two
 * dimensional grid.
 *
 * @extends Component
 */
class TileView extends Component<Props> {
    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._updateReceiverQuality();
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate() {
        this._updateReceiverQuality();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _height, _width, onClick } = this.props;
        const rowElements = this._groupIntoRows(this._renderThumbnails(), this._getColumnCount(), this._renderLocalThumbnails());

        return (
            <Container>
                <ScrollView
                    style = {{
                        ...styles.tileView,
                        height: _height,
                        width: _width,
                        position: 'absolute'
                    }}>

                    <TouchableWithoutFeedback onPress = { onClick }>
                        <View
                            style = {{
                                ...styles.tileViewRows,
                                minHeight: _height,
                                minWidth: _width
                            }}>


                            { rowElements }
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
                {this._shouldShowSmallLocalThumbnail() && this._smallLocalThumbnail()}
            </Container>
        );
    }

    /**
     * Returns how many columns should be displayed for tile view.
     *
     * @returns {number}
     * @private
     */
    _getColumnCount() {
        const participantCount = this.props._participants.length;

        if (participantCount === 4) {
            return 2;
        }

        if (this._isNarrowView()) {
            return participantCount > 3 ? 2 : 1;
        }

        return Math.min(3, participantCount);
    }

    /**
     * Returns all participants with the local participant at the end.
     *
     * @private
     * @returns {Participant[]}
     */
    _getSortedParticipants() {
        const participants = [];
        let localParticipant;

        for (const participant of this.props._participants) {
            if (participant.local) {
                localParticipant = participant;
            } else {
                participants.push(participant);
            }
        }

        localParticipant && !this._shouldShowSmallLocalThumbnail() && participants.push(localParticipant);

        return participants;
    }

    /**
     * Calculate the height and width for the tiles.
     *
     * @private
     * @returns {Object}
     */
    _getTileDimensions() {
        const { _height, _participants, _width } = this.props;
        const columns = this._getColumnCount();
        const participantCount = _participants.length;
        const heightToUse = _height - (MARGIN * 2);
        const widthToUse = _width - (MARGIN * 2);
        let tileWidth;
        let tileHeight;

        if (participantCount === 2) {
            tileHeight = heightToUse;
            tileWidth = widthToUse;
        } else if (participantCount >= 3 && participantCount < 5) {
            tileHeight = heightToUse / 2;
            tileWidth = widthToUse / columns;
        } else {
            tileHeight = heightToUse / 3;
            tileWidth = widthToUse / columns;
        }

        return {
            height: tileHeight,
            width: tileWidth
        };
    }

    /**
     * Splits a list of thumbnails into React Elements with a maximum of
     * {@link rowLength} thumbnails in each.
     *
     * @param {Array} thumbnails - The list of thumbnails that should be split
     * into separate row groupings.
     * @param {number} rowLength - How many thumbnails should be in each row.
     * @private
     * @returns {ReactElement[]}
     */
    _groupIntoRows(thumbnails, rowLength, localThumbnail) {
        const participantsCount = this.props._participants.length;
        const rowElements = [];

        if (participantsCount === 5 && this._isNarrowView()) {
            rowElements.push(this._getTilesRow(rowElements, localThumbnail));
        } else if (!this._isNarrowView() || participantsCount >= 4) {
            thumbnails.splice(this._getColumnCount() - 1, 0, localThumbnail);
        }

        for (let i = 0; i < thumbnails.length; i++) {
            if (i % rowLength === 0) {
                const thumbnailsInRow = thumbnails.slice(i, i + rowLength);

                rowElements.push(
                    this._getTilesRow(rowElements, thumbnailsInRow)
                );
            }
        }

        return rowElements;
    }

    /**
     * Creates React Elements to display participants in a thumbnail (without local tumbnail). Each
     * tile will be.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderThumbnails() {
        const styleOverrides = {
            aspectRatio: this._getTilesRatio(),
            flex: 0,
            height: this._getTileDimensions().height,
            width: null
        };

        return this._getSortedParticipants().filter(participant => !participant.local)
            .map(participant => (
                <Thumbnail
                    disableTint = { true }
                    key = { participant.id }
                    participant = { participant }
                    renderDisplayName = { true }
                    styleOverrides = { styleOverrides }
                    tileView = { true } />));
    }

    /**
     * Creates React Elements to display local thumbnail.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderLocalThumbnails() {
        const participantsCount = this.props._participants.length;
        const styleOverrides = {
            aspectRatio: this._getTilesRatio(),
            flex: 0,
            height: this._getTileDimensions().height,
            width: null
        };

        return this._getSortedParticipants().filter(participant => participant.local)
            .map(participant => {
                if (participantsCount === 5 && this._isNarrowView()) {
                    styleOverrides.aspectRatio = styleOverrides.aspectRatio * 2;
                }

                return (
                    <Thumbnail
                        disableTint = { true }
                        key = { participant.id }
                        participant = { participant }
                        renderDisplayName = { true }
                        styleOverrides = { styleOverrides }
                        tileView = { true } />);
            });
    }

    /**
     * Sets the receiver video quality based on the dimensions of the thumbnails
     * that are displayed.
     *
     * @private
     * @returns {void}
     */
    _updateReceiverQuality() {
        const { height, width } = this._getTileDimensions();

        this.props.dispatch(setTileViewDimensions({
            thumbnailSize: {
                height,
                width
            }
        }));
    }

    /**
     * Checks if a small local thumnail should be shown.
     *
     * @private
     * @returns {boolean}
     */
    _shouldShowSmallLocalThumbnail() {
        return this.props._participants.length <= 3;
    }

    /**
     * Render small Thumbnail at the top.
     *
     * @private
     * @returns {ReactElement}
     */
    _smallLocalThumbnail() {
        const stylesLocalThumbnail = {
            'position': 'absolute',
            right: 20,
            top: 50,
            zIndex: 1
        };

        return <LocalThumbnail styleOverrides = { stylesLocalThumbnail } />;
    }

    _isNarrowView() {
        return this.props._aspectRatio === ASPECT_RATIO_NARROW;
    }

    _getTilesRatio() {
        return this._getTileDimensions().width / this._getTileDimensions().height;
    }

    _getTilesRow(rowElements, thumbnail) {
        return (<View
            key = { rowElements.length }
            style = { styles.tileViewRow }>
            { thumbnail }
        </View>);
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code TileView}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const responsiveUi = state['features/base/responsive-ui'];

    return {
        _aspectRatio: responsiveUi.aspectRatio,
        _height: responsiveUi.clientHeight,
        _participants: state['features/base/participants'],
        _width: responsiveUi.clientWidth
    };
}

export default connect(_mapStateToProps)(TileView);

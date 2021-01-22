// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';

import Thumbnail from './Thumbnail';
import styles from './styles';

type Props = {

    /**
     * The local participant.
     */
    _localParticipant: Object,

    /**
     * Optional styling to add or override on the Thumbnail component root.
     */
    styleOverrides?: Object,

    /**
     * The z-order of the {@link Video} of {@link ParticipantView} in the
     * stacking space of all {@code Video}s. For more details, refer to the
     * {@code zOrder} property of the {@code Video} class for React Native.
     */
    zOrder: number,
};

/**
 * Component to render a local thumbnail that can be separated from the
 * remote thumbnails later.
 */
class LocalThumbnail extends Component<Props> {
    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { _localParticipant } = this.props;

        return (
            <View style = { styles.localThumbnail }>

                <Thumbnail
                    participant = { _localParticipant }
                    styleOverrides = { this.props.styleOverrides }
                    zOrder = { this.props?.zOrder } />
            </View>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code LocalThumbnail}'s
 * props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _localParticipant: Participant
 * }}
 */
function _mapStateToProps(state) {
    return {
        /**
         * The local participant.
         *
         * @private
         * @type {Participant}
         */
        _localParticipant: getLocalParticipant(state)
    };
}

export default connect(_mapStateToProps)(LocalThumbnail);

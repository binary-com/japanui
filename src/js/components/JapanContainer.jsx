import { connect } from 'react-redux';
import { Map } from 'immutable';
import { bindActionCreators } from 'redux';
import React from 'react';

import * as ActionsCreators from '../actions/ActionsCreators';
import JapanTableContainer from './JapanTableContainer';
import JapanForm from './JapanForm';
import NotificationsContainer from './NotificationsContainer';

const Japan = ({ state, actions }) => (<div className='japan-ui'>
  <NotificationsContainer state={state} />
  <JapanForm state={state} actions={actions}/>
  <JapanTableContainer state={state} actions={actions}/>
</div>);

Japan.displayName = 'Japan';
Japan.propTypes = {
  actions: React.PropTypes.object.isRequired,
  state: React.PropTypes.instanceOf(Map).isRequired,
};

const mapStateToProps = (state) => ({ state });
const mapDispatchToProps = (dispatch) => ({ actions: bindActionCreators(ActionsCreators, dispatch) });

const JapanContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Japan);

JapanContainer.displayName = 'JapanContainer';

export default JapanContainer;

import React from 'react';
import text from '../helpers/text';
import moment from 'moment';
import ContractEndTimer from './ContractEndTimer';

let prevTimeLeft;
let resultStr;
let alert = false;

const ContractEndTimerContainer = ({ timeLeft }) => {
  if (timeLeft <= 0) location.reload();
  if (prevTimeLeft !== timeLeft) {
    const duration = moment.duration(timeLeft * 1000);

    const result = [];
    const months = duration.months();
    if (months) {
      result.push(`${months}${text('months')}`);
    }

    const days = duration.days();
    if (days) {
      result.push(`${days}${text('days')}`);
    }

    const hours = duration.hours();
    if (hours) {
      result.push(`${hours}${text('hours')}`);
    }

    const minutes = duration.minutes();
    if (minutes) {
      result.push(`${minutes}${text('minutes')}`);
    }

    const seconds = duration.seconds();
    result.push(`${seconds}${text('seconds')}`);

    resultStr = result.join(' ');
    prevTimeLeft = timeLeft;

    alert = (timeLeft < 120);
  }

  return <ContractEndTimer alert={alert}>{timeLeft ? (timeLeft > 0 ? resultStr : '0') : '...'}</ContractEndTimer>;
};

ContractEndTimerContainer.displayName = 'ContractEndTimerContainer';
ContractEndTimerContainer.propTypes = {
  timeLeft: React.PropTypes.string,
};

export default ContractEndTimerContainer;

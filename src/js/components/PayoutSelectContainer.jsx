import React from 'react';
import InputBlock from './InputBlock';
import text from '../helpers/text';

const PayoutSelectContainer = (props) => {

  const props2 = Object.keys(props)
    .filter((key) => key !== 'state' && key !== 'options')
    .reduce((props2, key) => (props2[key] = props[key], props2), {});

  return (<InputBlock
    heading={text('Payout Amount')}>
      <div className='payout-input'>
        <div className='float-left'>
          <span>{text('¥')}</span> <input {...props2} id='payout'/>
          <label className='payout-mult' htmlFor='payout'>{text(',000')}</label>
        </div>
        <div className='float-left hint'>{text('min: 1,000')}<br />{text('max: 100,000')}</div>
      </div>
    </InputBlock>);
}
PayoutSelectContainer.displayName = 'PayoutSelectContainer';

export default PayoutSelectContainer;

import { WS_API } from '../middleware/SocketMiddleware';

export function authorize(payload) {
  return {
    [WS_API]: {
      types: ['PENDING_USER', 'FAILURE_USER', 'SUCCESS_USER'],
      authorize: payload.apiToken,
    },
    payload,
  };
}

export function getTimeOffset() {
  return {
    clientTime: parseInt((new Date()) / 1000, 10),
    [WS_API]: {
      types: ['PENDING_TIME', 'FAILURE_TIME', 'SUCCESS_TIME'],
      time: 1,
    },
  };
}

export function setExpiryCounter(payload) {
  return {
    skipLog: true,
    type: 'SET_TIME_LEFT',
    payload,
  };
}

export function subscribeTicks(payload) {
  return {
    skipLog: true,
    [WS_API]: {
      types: ['PENDING_TICK', 'FAILURE_TICK', 'SUCCESS_TICK'],
      ticks: payload.symbol,
      subscribe: 1,
    },
    payload,
  };
}

export function getSymbols() {
  return {
    [WS_API]: {
      types: ['PENDING_SYMBOLS', 'FAILURE_SYMBOLS', 'SUCCESS_SYMBOLS'],
      landing_company: 'japan',
      active_symbols: 'brief',
    },
  };
}

export function setSymbols(payload) {
  return { type: 'SET_SYMBOLS', payload };
}

export function setSymbol({ needToStore, symbol }) {
  return {
    type: 'SET_SYMBOL',
    payload: { needToStore, symbol },
  };
}

export function setDisplayName({ needToStore, display_name }) {
  return {
    type: 'SET_DISPLAY_NAME',
    payload: { needToStore, display_name },
  };
}

export function getTicks(payload) {
  return {
    skipLog: true,
    [WS_API]: {
      types: ['PENDING_TICK', 'FAILURE_TICK', 'SUCCESS_TICK'],
      ticks: payload.symbol,
      subscribe: 1,
    },
    payload,
  };
}

export function getContracts(payload) {
  return {
    [WS_API]: {
      types: ['PENDING_CONTRACTS', 'FAILURE_CONTRACTS', 'SUCCESS_CONTRACTS'],
      contracts_for: payload.symbol,
      currency: 'JPY',
      region: 'japan',
    },
    payload,
  };
}

export function setCategories(payload) {
  return { type: 'SET_CATEGORIES', payload };
}

export function setPeriods(payload) {
  return { type: 'SET_PERIODS', payload };
}

export function setBarriers(payload) {
  return { type: 'SET_BARRIERS', payload };
}

export function setContractTypes(payload) {
  return { type: 'SET_CONTRACT_TYPES', payload };
}

export function setCategory({ category, needToStore }) {
  return {
    type: 'SET_CATEGORY',
    payload: { needToStore, category },
  };
}

export function setPeriod({ period, needToStore }) {
  return {
    type: 'SET_PERIOD',
    payload: { needToStore, period },
  };
}

export function setPayout({ payout, needToStore }) {
  return {
    type: 'SET_PAYOUT',
    payload: { needToStore, payout },
  };
}

export function getPrice(payload) {
  const { contractType, symbol, endDate, payout, barrier } = payload;
  const request = {
    types: ['PENDING_PROPOSAL', 'FAILURE_PROPOSAL', 'SUCCESS_PROPOSAL'],
    proposal: 1,
    subscribe: 1,
    amount: payout,
    basis: 'payout',
    contract_type: contractType,
    currency: 'JPY',
    symbol: symbol,
    date_expiry: endDate,
  };

  let barrierName;
  if (typeof barrier === 'object') {
    request.barrier = barrier.get(1);
    request.barrier2 = barrier.get(0);
    barrierName = barrier.join('_');
  } else {
    request.barrier = barrier;
    barrierName = barrier;
  }

  const shortCode = [symbol, contractType, endDate, barrierName, payout].join('|');

  return {
    skipLog: true,
    [WS_API]: request,
    shortCode,
    payload,
  };
}

export function buy(payload) {
  const { type, price, barriers, payout, symbol, expiry } = payload;
  const parameters = {
    amount: payout,
    basis: 'payout',
    contract_type: type,
    currency: 'JPY',
    symbol: symbol,
    date_expiry: expiry,
    app_markup_percentage: '0'
  };

  const match = barriers.match(/^([\d.]+)_([\d.]+)$/);
  if (match) {
    parameters.barrier = match[2];
    parameters.barrier2 = match[1];
  } else {
    parameters.barrier = barriers;
  }

  const shortCode = [symbol, type, expiry, barriers, payout, price].join('|');

  return {
    [WS_API]: {
      types: ['PENDING_BUY', 'FAILURE_BUY', 'SUCCESS_BUY'],
      buy: 1,
      price: price,
      parameters,
    },
    shortCode,
    payload,
  };
}

export function close() {
  return { type: 'CLOSE', [WS_API]: { close: 1 } };
}

export function deleteProposalsStreams() {
  return { type: 'DELETE_STREAMS' };
}

export function showNotification(payload) {
  return { type: 'SHOW_NOTIFICATION', skipLog: true, payload };
}

export function hideNotification(payload) {
  return { type: 'HIDE_NOTIFICATION', skipLog: true, payload };
}

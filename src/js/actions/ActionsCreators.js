import SymbolsHelper from '../helpers/SymbolsHelper';
import ContractsHelper from '../helpers/ContractsHelper';

import showBuyWindow from '../patches/showBuyWindow';
import TradingAnalysis from '../patches/TradingAnalysis';
import * as Actions from './Actions';
import text from '../helpers/text';

import { Map, List } from 'immutable';

const timers = {};

function authorize() {
  return (dispatch, getState) => {
    if (typeof window.CommonData !== 'object') {
      return Promise.resolve();
    }

    const apiToken = window.CommonData.getLoginToken();

    if (getState().has('user') || !apiToken || !localStorage.getItem('client.tokens')) {
      return Promise.resolve();
    }

    return dispatch(Actions.authorize({ apiToken }));
  };
}

function getTimeOffset() {
  return (dispatch) => dispatch(Actions.getTimeOffset());
}

function setExpiryCounter() {
  clearTimeout(timers.leftTime);
  return (dispatch, getState) => {
    const offset = getState().get('timeOffset');

    if (typeof offset !== 'undefined') {
      const expiry = getState().getIn(['values', 'period']).split('_')[1];
      const timeLeft = expiry - (parseInt((new Date()) / 1000, 10) + offset);

      return dispatch(Actions.setExpiryCounter({ timeLeft }))
        .then(() => {
          if (timeLeft > 0) {
            timers.leftTime = setTimeout(() => dispatch(setExpiryCounter()), 1000);
          }
        });
    }

    return Promise.resolve();
  };
}

function getTicks(symbol) {
  return (dispatch, getState) => {
    if (!symbol) {
      return Promise.resolve();
    }

    const prevTickChannel = getState().getIn(['streams', 'ticks', 'channel']);
    if (prevTickChannel) {
      prevTickChannel.close();
    }

    return dispatch(Actions.forgetAllStreams('ticks'))
      .then(() => dispatch(Actions.getTicks({ symbol })));
  };
}

export function getSymbols() {
  clearTimeout(timers.contractsTimer);
  return (dispatch) => dispatch(authorize())
    .then(() => dispatch(getTimeOffset()))
    .then(() => dispatch(Actions.getSymbols()))
    .then(() => dispatch(setSymbols()))
    .then(() => dispatch(setSymbol()));
}

function setSymbols() {
  return (dispatch, getState) => {
    const symbols = getState().get('symbols', List());
    const symbolsList = SymbolsHelper.getSymbols(symbols, 'major_pairs')
      .toList()
      .map((symbol) => List.of(symbol.get('symbol'), symbol.get('display_name')));
    return dispatch(Actions.setSymbols({ symbols: symbolsList }));
  };
}

export function setSymbol(payload) {
  return (dispatch, getState) => {
    const symbols = getState().get('symbols');

    let symbol = payload && payload.symbol;
    const needToStore = Boolean(symbol);

    if (!symbol) {
      symbol = getState().getIn(['storage', 'symbol']);
    }

    if (!symbol) {
      const openedSymbols = SymbolsHelper.getSymbols(symbols, 'major_pairs', { state: true });
      symbol = openedSymbols.first() ? openedSymbols.first().get('symbol') : '';
    }

    if (!symbol) {
      return Promise.reject();
    }

    const displayName = SymbolsHelper.getDisplayName(symbols, symbol);
    return dispatch(Actions.hideNotification({uid: 'SYMBOL_ERROR'}))
      .then(() => dispatch(Actions.setSymbol({ needToStore, symbol })))
      .then(() => dispatch(Actions.setDisplayName({ needToStore: 1, symbol: symbol, display_name: displayName })))
      .then(() => dispatch(getContracts()))
      .then(() => dispatch(getTicks(symbol)))
      .catch((err = {}) => dispatch(
        Actions.showNotification({
          message: text(err.message),
          level: 'error',
          uid: 'SYMBOL_ERROR',
        })));
  };
}

function getContracts() {
  clearTimeout(timers.contractsTimer);
  return (dispatch, getState) => {
    const symbol = getState().getIn(['values', 'symbol']);
    return dispatch(Actions.hideNotification({uid: 'CONTRACT_ERROR'}))
      .then(() => dispatch(Actions.getContracts({ symbol })))
      .then(() => {
        timers.contractsTimer = setTimeout(() => dispatch(updateContracts()), 15 * 1000);
      })
      .then(() => dispatch(setCategories()))
      .then(() => dispatch(setCategory()))
      .catch((err = {}) => dispatch(
        Actions.showNotification({
          message: text(err.message),
          level: 'error',
          uid: 'CONTRACT_ERROR',
        })));
  };
}

function updateContracts() {
  clearTimeout(timers.contractsTimer);
  return (dispatch, getState) => {
    const symbol = getState().getIn(['values', 'symbol']);
    return dispatch(Actions.getContracts({ symbol }))
      .then(() => {
        timers.contractsTimer = setTimeout(() => dispatch(updateContracts()), 15 * 1000);
      })
      .then(() => dispatch(setCategories()))
      .then(() => dispatch(setPeriods()))
      .catch((err = {}) => dispatch(
        Actions.showNotification({
          message: text(err.message),
          level: 'error',
          uid: err.code,
        })));
  };
}

function setCategories() {
  return (dispatch, getState) => {
    const contracts = getState().getIn(['contracts', 'available']);
    const categories = ContractsHelper.getCategories(contracts);

    return dispatch(Actions.setCategories({ categories }));
  };
}

function setPeriods() {
  return (dispatch, getState) => {
    const contracts = getState().getIn(['contracts', 'available']);
    const category = getState().getIn(['values', 'category']);
    const periods = ContractsHelper.getTradingPeriods(contracts, category);

    return dispatch(Actions.setPeriods({ periods }));
  };
}

function setBarriers() {
  return (dispatch, getState) => {
    const category = getState().getIn(['values', 'category']);
    const period = getState().getIn(['values', 'period']);
    const contracts = getState().getIn(['contracts', 'available']);
    const [startDate, endDate] = period.split('_');
    const barriers = ContractsHelper.getJapanBarriers(contracts, category, startDate, endDate);

    return dispatch(Actions.setBarriers({ barriers }));
  };
}

function setContractTypes() {
  return (dispatch, getState) => {
    const category = getState().getIn(['values', 'category']);
    const contracts = getState().getIn(['contracts', 'available']);
    const contractTypes = ContractsHelper.getContractTypes(contracts, category);

    return dispatch(Actions.setContractTypes({ contractTypes }));
  };
}

export function setCategory(payload) {
  return (dispatch, getState) => {
    let category = payload && payload.category;
    const needToStore = Boolean(category);

    if (!category) {
      category = getState().getIn(['storage', 'category']);
    }

    if (!category) {
      const categories = getState().getIn(['values', 'categories']);
      category = categories.first();
    }

    TradingAnalysis().request();

    return dispatch(Actions.setCategory({ needToStore, category }))
      .then(() => dispatch(setContractTypes()))
      .then(() => dispatch(setPeriods()))
      .then(() => dispatch(setPeriod()))
      .catch((err = {}) => dispatch(
        Actions.showNotification({
          message: text(err.message),
          level: 'error',
          uid: err.code,
        })));
  };
}

export function setPeriod(payload) {
  clearTimeout(timers.leftTime);
  return (dispatch, getState) => {
    let period = payload && payload.period;
    const needToStore = Boolean(period);

    if (!period) {
      const periods = getState().getIn(['values', 'periods']);
      period = getState().getIn(['storage', 'period']);

      if (!periods.filter((v) => `${v.get('start')}_${v.get('end')}` === period).size) {
        period = `${periods.first().get('start')}_${periods.first().get('end')}`;
      }
    }

    return dispatch(Actions.setPeriod({ period, needToStore }))
      .then(() => dispatch(setBarriers()))
      .then(() => {
        const barriersCount = getState().getIn(['values', 'barriers']).size;
        if (barriersCount === 0) {
          dispatch(Actions.showNotification({
            message: text('All barriers in this trading window are expired'),
            level: 'warning',
            uid: 'NO_BARRIER',
          }));
        } else {
          dispatch(Actions.hideNotification({uid: 'NO_BARRIER'}));
        }
      })
      .then(() => dispatch(setExpiryCounter()))
      .then(() => {
        const offset = getState().get('timeOffset');
        if (typeof offset !== 'undefined') {
          const expiry = getState().getIn(['values', 'period']).split('_')[1];
          const timeLeft = expiry - (parseInt((new Date()) / 1000, 10) + offset);

          if (timeLeft < 120 && timeLeft > 0) {
            dispatch(Actions.showNotification({
              message: text('This contract can not be traded in the final 2 minutes before settlement'),
              level: 'info',
              uid: 'TIME_LEFT',
            }));
          }
        }
      })
      .then(() => dispatch(setPayout()))
      .catch((err = {}) => dispatch(
        Actions.showNotification({
          message: text(err.message),
          level: 'error',
          uid: err.code,
        })));
  };
}

let payoutPromise;
export function setPayout(payload) {
  return (dispatch, getState) => {
    let payout = payload && (+payload.payout);

    const needToStore = Boolean(payout);

    if (typeof payout === 'undefined') {
      payout = getState().getIn(['storage', 'payout']);
    }
    else if ((payout % 1 !== 0) || payout < 1 || payout > 100) {
        return false;
    }

    if (!payout) {
      payout = 1;
    }

    return dispatch(Actions.setPayout({ payout, needToStore }))
      .then(() => {
        if (!payoutPromise || payoutPromise.resolved) {
          let resolve;
          payoutPromise = new Promise((res) => { resolve = res });
          payoutPromise.resolve = resolve;
        }
        clearTimeout(timers.setPayout);
        timers.setPayout = setTimeout(() => {
          payoutPromise.resolve();
          payoutPromise.resolved = true;
          return dispatch(getPrices());
        }, needToStore ? 500 : 0);

        return payoutPromise;
      }).catch((err = {}) => dispatch(
        Actions.showNotification({
          message: text(err.message),
          level: 'error',
          uid: err.code,
        })));
  }
}

export function getPrices() {
  return (dispatch, getState) => {
    const symbol = getState().getIn(['values', 'symbol']);
    const [, endDate] = getState().getIn(['values', 'period'], '').split('_');
    const payout = Number(getState().getIn(['values', 'payout']), 10) * 1000 || 1000;
    const barriers = getState().getIn(['values', 'barriers']);
    const contractTypes = getState().getIn(['values', 'contractTypes']);
    const req_id = (getState().getIn(['values', 'proposal_req_id']) || 0) + 1;

    return dispatch(Actions.forgetAllStreams('proposal'))
      .then(() => dispatch(deleteProposalsStreams()))
      .then(() => {
        contractTypes.forEach((contractType) => barriers.forEach((barrier) => (
          dispatch(Actions.getPrice({ contractType, symbol, endDate, payout, barrier, req_id }))
          .catch((err = {}) => {
            if (err.code === 'RateLimit') {
              var binary_static_error = document.getElementById('ratelimit-error-message');
              if (binary_static_error && binary_static_error.offsetWidth) {
                binary_static_error.setAttribute('style', 'display:none;');
              }
              return dispatch(Actions.showNotification({
                message: text(err.message),
                level: 'error',
                dismissible: false,
                uid: 'PROPOSAL_LIMIT',
                action: {
                  label: text('Refresh page'),
                  callback() {
                    location.reload();
                  },
                },
              }));
            }

            return Promise.resolve();
          })
        )))
      });

    return Promise.resolve();
  };
}

export function buy({ type, price, barriers }) {
  return (dispatch, getState) => {
    const payout = (getState().getIn(['values', 'payout']) || 1) * 1000;
    const symbol = getState().getIn(['values', 'symbol']);
    const start = getState().getIn(['values', 'period']).split('_')[0];
    const expiry = getState().getIn(['values', 'period']).split('_')[1];

    disablePriceButtons()
    dispatch(() => dispatch(Actions.buy({ type, price, barriers, payout, symbol, start, expiry })))
      .then((payload) => {
        showBuyWindow(payload.contract_id);
        dispatch(Actions.hideNotification({uid: 'BUY_ERROR'}));
      }).catch((err = {}) => (
        dispatch(Actions.showNotification({ message: text(err.message), level: 'error', uid: 'BUY_ERROR' }))
          .then(enablePriceButtons())
      ));
  };
}

export function enablePriceButtons() {
  document.getElementById('disable-overlay').classList.add('invisible');
}

function disablePriceButtons() {
  document.getElementById('disable-overlay').classList.remove('invisible');
}

export function close() {
  Object.keys(timers).forEach((key) => {
    clearInterval(timers[key]);
    clearTimeout(timers[key]);
  });

  return Actions.close();
}

function deleteProposalsStreams() {
  return (dispatch, getState) => {
    const streams = getState().getIn(['streams', 'proposals'], Map())
      .concat(getState().getIn(['errors', 'proposals'], Map()));

    streams.forEach((stream) => {
      const channel = stream.get('channel');
      if (channel) {
        channel.close();
      }
    });

    if (!streams.isEmpty()) {
      return dispatch(Actions.deleteProposalsStreams());
    }

    return Promise.resolve();
  };
}

import { RABBITMQ_CONNECTION_TOKEN, RABBITMQ_CONNECTION_OPTIONS_TOKEN } from './rabbitmq.constants';
import { isSymbol } from 'util';

export function getRabbitmqConnectionToken(token: string | symbol = RABBITMQ_CONNECTION_TOKEN) {
  if (token === RABBITMQ_CONNECTION_TOKEN) {
    return RABBITMQ_CONNECTION_TOKEN;
  } else if (!isSymbol(token)) {
    return Symbol(token);
  } else {
    return token;
  }
}

export function getRabbitmqConnectionOptionsToken(token: string | symbol = RABBITMQ_CONNECTION_OPTIONS_TOKEN) {
  if (token === RABBITMQ_CONNECTION_OPTIONS_TOKEN) {
    return RABBITMQ_CONNECTION_OPTIONS_TOKEN;
  } else if (!isSymbol(token)) {
    return Symbol(token);
  } else {
    return token;
  }
}

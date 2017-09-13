const { Roll, WodRoll } = require('roll-parser');

const MAX_DICE = 99999;
const MAX_COUNT = 12;

const MIN_MOD = -9999;
const MAX_MOD = 9999;

const MAX_SUCCESS = 99999;
const MAX_FAIL = 99998;

function limit(roll) {
  if (roll instanceof Roll) {
    const dice = Math.min(roll.dice, MAX_DICE);
    const count = Math.min(roll.count, MAX_COUNT);
    const modifier = Math.max(Math.min(roll.modifier, MAX_MOD), MIN_MOD);
    return new Roll(dice, count, modifier);
  } else if (roll instanceof WodRoll) {
    const dice = Math.min(roll.dice, MAX_DICE);
    const count = Math.min(roll.count, MAX_COUNT);
    const success = Math.min(roll.success, MAX_SUCCESS);
    const fail = Math.min(roll.fail, MAX_FAIL);
    return new WodRoll(dice, count, roll.again, success, fail);
  }

  return null;
}

module.exports = {
  limit
};

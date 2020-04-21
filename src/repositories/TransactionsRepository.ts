import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const income = transactions.reduce(
      (accum, item) =>
        item.type === 'income' ? accum + Number(item.value) : accum,
      0,
    );

    const outcome = transactions.reduce(
      (accum, item) =>
        item.type === 'outcome' ? accum + Number(item.value) : accum,
      0,
    );

    const total = income - outcome;

    return {
      income,
      outcome,
      total,
    };
  }

  public async outcomeValid(value: number): Promise<boolean> {
    const { total } = await this.getBalance();

    if (total < value) {
      return false;
    }

    return true;
  }
}

export default TransactionsRepository;

import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transcationsRepository = getRepository(Transaction);

    await transcationsRepository.delete(id);
  }
}

export default DeleteTransactionService;

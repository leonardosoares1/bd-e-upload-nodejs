import { getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface Request {
  filepath: string;
}

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ filepath }: Request): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getRepository(Transaction);

    const transactionsReadStream = fs.createReadStream(filepath);

    const csvParseConfig = csvParse({
      from_line: 2,
    });

    const parseCSV = transactionsReadStream.pipe(csvParseConfig);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value || !category) {
        return;
      }

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const existentCategoriesTitles = existentCategories.map(
      (item: Category) => item.title,
    );

    const addCategoriesTitles = categories
      .filter(item => !existentCategoriesTitles.includes(item))
      .filter((item, index, self) => self.indexOf(item) === index);

    const newCatogories = categoriesRepository.create(
      addCategoriesTitles.map(item => ({ title: item })),
    );
    await categoriesRepository.save(newCatogories);

    const finalCategories = [...newCatogories, ...existentCategories];

    const newTransactions = transactionsRepository.create(
      transactions.map(item => ({
        ...item,
        category: finalCategories.find(
          category => category.title === item.category,
        ),
      })),
    );

    await transactionsRepository.save(newTransactions);

    await fs.promises.unlink(filepath);

    return newTransactions;
  }
}

export default ImportTransactionsService;

import { EntityRepository, Repository } from 'typeorm';

import Category from '../models/Category';

@EntityRepository(Category)
class CategoriesRepository extends Repository<Category> {
  public async findOrCreate(title: string): Promise<Category> {
    const categoryExists = await this.findOne({ where: { title } });

    if (categoryExists) {
      return categoryExists;
    }

    const category = this.create({ title });

    await this.save(category);

    return category;
  }
}

export default CategoriesRepository;

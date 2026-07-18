import slugifyLib from 'slugify';
import { CategoryRepository, CategoryTreeNode } from './category.repository';
import { CategoryDocument } from './category.model';

export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async create(name: string, parentId?: string): Promise<CategoryDocument> {
    const slug = await this.generateUniqueSlug(name, parentId);
    return this.categoryRepository.create({ name, slug, parentId });
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryRepository.findAll();
  }

  async findTree(): Promise<CategoryTreeNode[]> {
    return this.categoryRepository.findTree();
  }

  async findBySlug(slug: string, parentId?: string): Promise<CategoryDocument | null> {
    return this.categoryRepository.findBySlug(slug, parentId);
  }

  async update(
    id: string,
    data: { name?: string; parentId?: string | null }
  ): Promise<CategoryDocument | null> {
    if (data.parentId !== undefined) {
      await this.ensureNoCircularReference(id, data.parentId);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.slug = await this.generateUniqueSlug(data.name, data.parentId ?? undefined, id);
    }
    if (data.parentId !== undefined) {
      updateData.parentId = data.parentId || null;
    }

    return this.categoryRepository.update(id, updateData);
  }

  async delete(id: string): Promise<boolean> {
    return this.categoryRepository.delete(id);
  }

  private async ensureNoCircularReference(categoryId: string, newParentId: string | null): Promise<void> {
    if (!newParentId) return;

    const descendantIds = await this.collectDescendantIds(categoryId);
    if (descendantIds.includes(newParentId)) {
      throw new Error('Cannot move a category into its own descendant');
    }
  }

  private async collectDescendantIds(id: string): Promise<string[]> {
    const children = await this.categoryRepository.findChildren(id);
    const ids: string[] = [];
    for (const child of children) {
      ids.push(child._id.toString());
      const grandchildIds = await this.collectDescendantIds(child._id.toString());
      ids.push(...grandchildIds);
    }
    return ids;
  }

  private async generateUniqueSlug(name: string, parentId?: string, excludeId?: string): Promise<string> {
    let slug = slugifyLib(name, { lower: true, strict: true });
    let counter = 1;
    let existing = await this.categoryRepository.findBySlug(slug, parentId);
    while (existing && existing._id.toString() !== excludeId) {
      slug = `${slugifyLib(name, { lower: true, strict: true })}-${counter}`;
      counter++;
      existing = await this.categoryRepository.findBySlug(slug, parentId);
    }
    return slug;
  }
}

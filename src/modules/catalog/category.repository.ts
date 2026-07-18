import { Category, CategoryDocument } from './category.model';

export interface CategoryTreeNode {
  _id: string;
  name: string;
  slug: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  children: CategoryTreeNode[];
}

export class CategoryRepository {
  async findAll(): Promise<CategoryDocument[]> {
    return Category.find().sort({ name: 1 });
  }

  async findById(id: string): Promise<CategoryDocument | null> {
    return Category.findById(id);
  }

  async findBySlug(slug: string, parentId?: string): Promise<CategoryDocument | null> {
    const filter: Record<string, unknown> = { slug };
    if (parentId) {
      filter.parentId = parentId;
    }
    return Category.findOne(filter);
  }

  async findChildren(parentId: string): Promise<CategoryDocument[]> {
    return Category.find({ parentId }).sort({ name: 1 });
  }

  async findTree(): Promise<CategoryTreeNode[]> {
    const all = await Category.find().lean();

    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const doc of all) {
      map.set(doc._id.toString(), {
        _id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        parentId: doc.parentId?.toString(),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        children: [],
      });
    }

    for (const node of map.values()) {
      if (node.parentId) {
        const parent = map.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async create(data: { name: string; slug: string; parentId?: string }): Promise<CategoryDocument> {
    const category = new Category({ name: data.name, slug: data.slug, parentId: data.parentId });
    return category.save();
  }

  async update(id: string, data: Partial<{ name: string; slug: string; parentId: string | null }>): Promise<CategoryDocument | null> {
    return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<boolean> {
    const descendantIds = await this.collectDescendantIds(id);
    const idsToDelete = [id, ...descendantIds];
    const result = await Category.deleteMany({ _id: { $in: idsToDelete } });
    return result.deletedCount > 0;
  }

  private async collectDescendantIds(id: string): Promise<string[]> {
    const children = await Category.find({ parentId: id });
    const ids: string[] = [];
    for (const child of children) {
      ids.push(child._id.toString());
      const grandchildIds = await this.collectDescendantIds(child._id.toString());
      ids.push(...grandchildIds);
    }
    return ids;
  }
}

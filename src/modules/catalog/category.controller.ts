import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';

const categoryService = new CategoryService(new CategoryRepository());

export async function getTree(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tree = await categoryService.findTree();
    res.json({ success: true, data: tree });
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slug = req.params.slug as string;
    const category = await categoryService.findBySlug(slug);
    if (!category) {
      res.status(404).json({ success: false, error: { message: 'Category not found', code: 404 } });
      return;
    }
    const children = await new CategoryRepository().findChildren(category._id.toString());
    res.json({ success: true, data: { category, children } });
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, parentId } = req.body;
    const category = await categoryService.create(name, parentId);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { name, parentId } = req.body;
    const category = await categoryService.update(id, { name, parentId });
    if (!category) {
      res.status(404).json({ success: false, error: { message: 'Category not found', code: 404 } });
      return;
    }
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const deleted = await categoryService.delete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Category not found', code: 404 } });
      return;
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
}

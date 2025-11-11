/**
 * Sheet Service
 * Manages CRUD operations for sheets (spreadsheet data)
 */

import prisma from '../db/prisma.js'

/**
 * Sheet interfaces
 */
export interface SheetColumn {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean'
  width?: number
}

export interface Sheet {
  id: number
  title: string
  description?: string | null
  columns: SheetColumn[]
  rows: any[][]
  ownerId?: number | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FindManyOptions {
  where?: {
    ownerId?: number
    isPublic?: boolean
  }
  skip?: number
  take?: number
  orderBy?: {
    [key: string]: 'asc' | 'desc'
  }
}

export interface CreateSheetData {
  title: string
  description?: string
  columns: SheetColumn[]
  rows?: any[][]
  ownerId?: number
  isPublic?: boolean
}

export interface UpdateSheetData {
  title?: string
  description?: string
  columns?: SheetColumn[]
  rows?: any[][]
  isPublic?: boolean
}

/**
 * Find multiple sheets
 */
export async function findMany(options?: FindManyOptions): Promise<Sheet[]> {
  const sheets = await prisma.sheet.findMany({
    where: options?.where,
    skip: options?.skip,
    take: options?.take,
    orderBy: options?.orderBy,
  })

  return sheets.map(sheet => ({
    ...sheet,
    columns: JSON.parse(sheet.columns) as SheetColumn[],
    rows: JSON.parse(sheet.rows) as any[][],
  }))
}

/**
 * Find a single sheet by ID
 */
export async function findOne(id: number): Promise<Sheet | null> {
  const sheet = await prisma.sheet.findUnique({
    where: { id },
  })

  if (!sheet) {
    return null
  }

  return {
    ...sheet,
    columns: JSON.parse(sheet.columns) as SheetColumn[],
    rows: JSON.parse(sheet.rows) as any[][],
  }
}

/**
 * Create a new sheet
 */
export async function create(data: CreateSheetData): Promise<Sheet> {
  // Validate columns
  if (!data.columns || data.columns.length === 0) {
    throw new Error('At least one column is required')
  }

  // Validate column names are unique
  const columnNames = data.columns.map(col => col.name)
  const uniqueNames = new Set(columnNames)
  if (columnNames.length !== uniqueNames.size) {
    throw new Error('Column names must be unique')
  }

  const sheet = await prisma.sheet.create({
    data: {
      title: data.title,
      description: data.description,
      columns: JSON.stringify(data.columns),
      rows: JSON.stringify(data.rows || []),
      ownerId: data.ownerId,
      isPublic: data.isPublic ?? false,
    },
  })

  return {
    ...sheet,
    columns: JSON.parse(sheet.columns) as SheetColumn[],
    rows: JSON.parse(sheet.rows) as any[][],
  }
}

/**
 * Update an existing sheet
 */
export async function update(id: number, data: UpdateSheetData): Promise<Sheet> {
  // Check if sheet exists
  const existing = await prisma.sheet.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error(`Sheet with id ${id} not found`)
  }

  // Validate columns if provided
  if (data.columns) {
    if (data.columns.length === 0) {
      throw new Error('At least one column is required')
    }

    const columnNames = data.columns.map(col => col.name)
    const uniqueNames = new Set(columnNames)
    if (columnNames.length !== uniqueNames.size) {
      throw new Error('Column names must be unique')
    }
  }

  const updateData: any = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.columns !== undefined) updateData.columns = JSON.stringify(data.columns)
  if (data.rows !== undefined) updateData.rows = JSON.stringify(data.rows)
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic

  const sheet = await prisma.sheet.update({
    where: { id },
    data: updateData,
  })

  return {
    ...sheet,
    columns: JSON.parse(sheet.columns) as SheetColumn[],
    rows: JSON.parse(sheet.rows) as any[][],
  }
}

/**
 * Delete a sheet
 */
export async function deleteOne(id: number): Promise<boolean> {
  try {
    await prisma.sheet.delete({
      where: { id },
    })
    return true
  } catch (error) {
    console.error(`Error deleting sheet ${id}:`, error)
    throw new Error(`Failed to delete sheet with id ${id}`)
  }
}

/**
 * Count sheets
 */
export async function count(where?: FindManyOptions['where']): Promise<number> {
  return await prisma.sheet.count({ where })
}

/**
 * Add a row to a sheet
 */
export async function addRow(id: number, rowData: any[]): Promise<Sheet> {
  const sheet = await findOne(id)
  if (!sheet) {
    throw new Error(`Sheet with id ${id} not found`)
  }

  // Validate row data length matches columns
  if (rowData.length !== sheet.columns.length) {
    throw new Error(
      `Row data length (${rowData.length}) does not match number of columns (${sheet.columns.length})`
    )
  }

  const newRows = [...sheet.rows, rowData]
  return await update(id, { rows: newRows })
}

/**
 * Update a specific cell in a sheet
 */
export async function updateCell(
  id: number,
  rowIndex: number,
  colIndex: number,
  value: any
): Promise<Sheet> {
  const sheet = await findOne(id)
  if (!sheet) {
    throw new Error(`Sheet with id ${id} not found`)
  }

  // Validate indices
  if (rowIndex < 0 || rowIndex >= sheet.rows.length) {
    throw new Error(`Invalid row index: ${rowIndex}`)
  }
  if (colIndex < 0 || colIndex >= sheet.columns.length) {
    throw new Error(`Invalid column index: ${colIndex}`)
  }

  // Update the cell
  const newRows = sheet.rows.map((row, rIdx) => {
    if (rIdx === rowIndex) {
      const newRow = [...row]
      newRow[colIndex] = value
      return newRow
    }
    return row
  })

  return await update(id, { rows: newRows })
}

/**
 * Delete a row from a sheet
 */
export async function deleteRow(id: number, rowIndex: number): Promise<Sheet> {
  const sheet = await findOne(id)
  if (!sheet) {
    throw new Error(`Sheet with id ${id} not found`)
  }

  if (rowIndex < 0 || rowIndex >= sheet.rows.length) {
    throw new Error(`Invalid row index: ${rowIndex}`)
  }

  const newRows = sheet.rows.filter((_, idx) => idx !== rowIndex)
  return await update(id, { rows: newRows })
}

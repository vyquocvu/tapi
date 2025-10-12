/**
 * Migration Manager
 * Handles tracking and applying content type migrations
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { MigrationRecord, ContentTypeRegistry } from './types.js'

export class MigrationManager {
  private migrationsDir: string
  private migrationsFile: string

  constructor(projectRoot: string = process.cwd()) {
    this.migrationsDir = join(projectRoot, 'content-types', 'migrations')
    this.migrationsFile = join(this.migrationsDir, 'migrations.json')
    this.ensureMigrationsDir()
  }

  /**
   * Ensure migrations directory exists
   */
  private ensureMigrationsDir(): void {
    if (!existsSync(this.migrationsDir)) {
      mkdirSync(this.migrationsDir, { recursive: true })
    }
  }

  /**
   * Load all migration records
   */
  loadMigrations(): MigrationRecord[] {
    if (!existsSync(this.migrationsFile)) {
      return []
    }

    try {
      const data = readFileSync(this.migrationsFile, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error loading migrations:', error)
      return []
    }
  }

  /**
   * Save migration records
   */
  saveMigrations(migrations: MigrationRecord[]): void {
    this.ensureMigrationsDir()
    writeFileSync(this.migrationsFile, JSON.stringify(migrations, null, 2), 'utf-8')
  }

  /**
   * Create a new migration
   */
  createMigration(
    name: string,
    contentTypes: string[],
    up: string,
    down: string
  ): MigrationRecord {
    const timestamp = Date.now()
    const id = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}`

    const migration: MigrationRecord = {
      id,
      name,
      timestamp,
      contentTypes,
      up,
      down,
      applied: false,
    }

    const migrations = this.loadMigrations()
    migrations.push(migration)
    this.saveMigrations(migrations)

    return migration
  }

  /**
   * Mark a migration as applied
   */
  markAsApplied(migrationId: string): void {
    const migrations = this.loadMigrations()
    const migration = migrations.find((m) => m.id === migrationId)

    if (migration) {
      migration.applied = true
      migration.appliedAt = new Date()
      this.saveMigrations(migrations)
    }
  }

  /**
   * Mark a migration as unapplied (for rollback)
   */
  markAsUnapplied(migrationId: string): void {
    const migrations = this.loadMigrations()
    const migration = migrations.find((m) => m.id === migrationId)

    if (migration) {
      migration.applied = false
      migration.appliedAt = undefined
      this.saveMigrations(migrations)
    }
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations(): MigrationRecord[] {
    const migrations = this.loadMigrations()
    return migrations.filter((m) => !m.applied)
  }

  /**
   * Get applied migrations
   */
  getAppliedMigrations(): MigrationRecord[] {
    const migrations = this.loadMigrations()
    return migrations.filter((m) => m.applied)
  }

  /**
   * Get the last applied migration
   */
  getLastAppliedMigration(): MigrationRecord | undefined {
    const applied = this.getAppliedMigrations()
    return applied.length > 0 ? applied[applied.length - 1] : undefined
  }

  /**
   * Check if there are pending migrations
   */
  hasPendingMigrations(): boolean {
    return this.getPendingMigrations().length > 0
  }

  /**
   * Generate migration name from content type changes
   */
  generateMigrationName(contentTypes: string[]): string {
    if (contentTypes.length === 1) {
      return `update_${contentTypes[0]}`
    }
    return `update_content_types`
  }

  /**
   * Compare content type registries and detect changes
   */
  detectChanges(
    oldRegistry: ContentTypeRegistry,
    newRegistry: ContentTypeRegistry
  ): {
    added: string[]
    removed: string[]
    modified: string[]
  } {
    const added: string[] = []
    const removed: string[] = []
    const modified: string[] = []

    // Check for added and modified
    for (const uid of Object.keys(newRegistry)) {
      if (!oldRegistry[uid]) {
        added.push(uid)
      } else if (JSON.stringify(oldRegistry[uid]) !== JSON.stringify(newRegistry[uid])) {
        modified.push(uid)
      }
    }

    // Check for removed
    for (const uid of Object.keys(oldRegistry)) {
      if (!newRegistry[uid]) {
        removed.push(uid)
      }
    }

    return { added, removed, modified }
  }

  /**
   * Clear all migrations (use with caution)
   */
  clearMigrations(): void {
    if (existsSync(this.migrationsFile)) {
      writeFileSync(this.migrationsFile, JSON.stringify([], null, 2), 'utf-8')
    }
  }
}

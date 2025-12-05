export const embeddingSourceColumns: Record<string, string[]> = {
    // Curriculum tables
    'crclm_sub_la': ['name', 'abbreviation', 'description'],
    'lrn_a_cont': ['description', 'number'],
    'lrn_a_std': ['name', 'description'],
    'lrn_a_std_elab': ['name', 'standardElaboration'],
    'outcome': ['description'],
    'key_skill': ['topicName', 'description'],
    'key_knowledge': ['topicName', 'description'],
    'exam_question': ['question', 'answer'],
    'lrn_activity': ['content'],
    'assess_task': ['content'],
    'crclm_sub_cont': ['content'],
    
    // Task tables
    'task_block': ['type', 'config'],
    'cls_task_block_res': ['response', 'feedback'],
    'cls_task_res': ['comment', 'feedback'],
    'tb_guidance': ['guidance'],
    'tb_misc': ['misconception'],
    'rubric_cell': ['level', 'description'],

    // Course Map tables
    'cm_itm_ass_pln': ['name', 'scope', 'description'],
    'cm_itm_les_pln': ['name', 'scope', 'description'],

    // News
    'news': ['title', 'excerpt', 'content'],

    // Subject tables
    'sub_thread': ['title', 'content'],
    'sub_thread_resp': ['content']
};

/**
 * Get the columns to embed for a given table
 */
export function getEmbeddingColumns(tableName: string): string[] {
    return embeddingSourceColumns[tableName] ?? [];
}

/**
 * Extract only the configured columns from a record and stringify
 */
export function buildEmbeddingText<T extends Record<string, unknown>>(
    tableName: string,
    record: T
): string {
    const columns = getEmbeddingColumns(tableName);
    
    if (columns.length === 0) {
        // No config - stringify entire record
        return JSON.stringify(record);
    }
    
    // Pick only the configured columns
    const subset: Record<string, unknown> = {};
    for (const col of columns) {
        if (col in record) {
            subset[col] = record[col];
        }
    }
    
    return JSON.stringify(subset);
}

/**
 * Parse embedding text back to a partial record
 */
export function parseEmbeddingText<T extends Record<string, unknown>>(
    text: string
): Partial<T> {
    try {
        return JSON.parse(text) as Partial<T>;
    } catch {
        // If parsing fails, return empty object
        return {} as Partial<T>;
    }
}
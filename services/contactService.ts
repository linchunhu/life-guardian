import { supabase, type Contact } from '../lib/supabaseClient';

/**
 * 获取用户的所有联系人
 */
export async function getContacts(userId: string): Promise<Contact[]> {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching contacts:', error);
        return [];
    }

    return data || [];
}

/**
 * 创建联系人
 */
export async function createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact | null> {
    const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single();

    if (error) {
        console.error('Error creating contact:', error);
        return null;
    }

    return data;
}

/**
 * 更新联系人
 */
export async function updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const { data, error } = await supabase
        .from('contacts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating contact:', error);
        return null;
    }

    return data;
}

/**
 * 删除联系人
 */
export async function deleteContact(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting contact:', error);
        return false;
    }

    return true;
}

/**
 * 获取联系人数量
 */
export async function getContactCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        console.error('Error counting contacts:', error);
        return 0;
    }

    return count || 0;
}

import { supabase, type WillItem } from '../lib/supabaseClient';

export type WillItemType = 'video' | 'letter' | 'asset' | 'audio';
export type WillItemStatus = 'ready' | 'draft' | 'unconfigured';

/**
 * 获取用户的所有遗嘱项目
 */
export async function getWillItems(userId: string): Promise<WillItem[]> {
    const { data, error } = await supabase
        .from('will_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching will items:', error);
        return [];
    }

    return data || [];
}

/**
 * 创建遗嘱项目
 */
export async function createWillItem(item: {
    user_id: string;
    type: WillItemType;
    title: string;
    status?: WillItemStatus;
    description?: string;
    file_url?: string;
    meta?: string;
    meta_icon?: string;
}): Promise<WillItem | null> {
    const { data, error } = await supabase
        .from('will_items')
        .insert({
            ...item,
            status: item.status || 'draft',
            meta_icon: item.meta_icon || 'edit',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating will item:', error);
        return null;
    }

    return data;
}

/**
 * 更新遗嘱项目
 */
export async function updateWillItem(id: string, updates: Partial<WillItem>): Promise<WillItem | null> {
    const { data, error } = await supabase
        .from('will_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating will item:', error);
        return null;
    }

    return data;
}

/**
 * 删除遗嘱项目
 */
export async function deleteWillItem(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('will_items')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting will item:', error);
        return false;
    }

    return true;
}

/**
 * 获取遗嘱项目统计
 */
export async function getWillItemsStats(userId: string): Promise<{
    total: number;
    ready: number;
    draft: number;
    unconfigured: number;
}> {
    const items = await getWillItems(userId);

    const stats = {
        total: items.length,
        ready: 0,
        draft: 0,
        unconfigured: 0,
    };

    items.forEach(item => {
        if (item.status === 'ready') stats.ready++;
        else if (item.status === 'draft') stats.draft++;
        else if (item.status === 'unconfigured') stats.unconfigured++;
    });

    return stats;
}

/**
 * 上传遗嘱文件（视频/音频等）
 */
export async function uploadWillFile(
    userId: string,
    file: File,
    itemId: string
): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${itemId}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from('will-files')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) {
        console.error('Error uploading file:', error);
        return null;
    }

    // 获取公开URL
    const { data: { publicUrl } } = supabase.storage
        .from('will-files')
        .getPublicUrl(data.path);

    return publicUrl;
}

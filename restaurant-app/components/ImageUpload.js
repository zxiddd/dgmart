'use client';
import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/config/supabase';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://172.20.10.2:5000';

export default function ImageUpload({ value, onChange, folder = 'uploads', label = 'Image' }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setUploading(true);

        try {
            // Get auth token from Supabase session
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('Not authenticated. Please log in again.');
            }

            // Build FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);

            // Use native fetch — avoids axios Content-Type header conflicts
            const response = await fetch(`${BACKEND_URL}/upload`, {
                method: 'POST',
                headers: {
                    // Do NOT set Content-Type — browser sets it with correct multipart boundary
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || `Upload failed with status ${response.status}`);
            }

            console.log('Upload success, URL:', result.data.url);
            onChange(result.data.url);

        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + (error.message || 'Please try again.'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = () => {
        onChange('');
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">{label}</label>

            {value ? (
                <div className="relative w-full h-40 group">
                    <img
                        src={value}
                        alt="Upload preview"
                        className="w-full h-full object-cover rounded-xl border border-gray-200"
                    />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-orange-500 hover:bg-orange-50 transition-all text-gray-400 disabled:opacity-50"
                >
                    {uploading ? (
                        <>
                            <Loader2 size={32} className="animate-spin text-orange-600" />
                            <span className="text-sm font-medium">Uploading...</span>
                        </>
                    ) : (
                        <>
                            <div className="p-3 bg-gray-50 rounded-full">
                                <Upload size={24} />
                            </div>
                            <span className="text-sm font-medium">Click to upload image</span>
                            <span className="text-xs text-gray-400">JPG, PNG, WebP (Max 5MB)</span>
                        </>
                    )}
                </button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}

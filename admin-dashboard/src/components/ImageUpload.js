'use client';
import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import api from '@/lib/api';

export default function ImageUpload({ value, onChange, folder = 'uploads', label = 'Image' }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        try {
            const res = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data.success) {
                onChange(res.data.data.url);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
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
            <label className="block text-sm font-medium text-gray-700">{label}</label>

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
                    className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-orange-50 transition-all text-gray-500 disabled:opacity-50"
                >
                    {uploading ? (
                        <>
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <span className="text-sm font-medium">Uploading...</span>
                        </>
                    ) : (
                        <>
                            <div className="p-3 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
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

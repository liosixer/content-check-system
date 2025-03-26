'use client';

import { useState, useCallback } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useDropzone } from 'react-dropzone';

export default function ImageReview() {
  const [result, setResult] = useState<{
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
  } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // 创建预览URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // 创建FormData对象
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/image-review', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('图片审核失败:', error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
  });

  return (
    <Box>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#f0f0f0' : 'white',
        }}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <Typography>
          {isDragActive
            ? '将图片拖放到这里'
            : '点击或拖放图片到这里进行审核'}
        </Typography>
      </Paper>

      {preview && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <img
            src={preview}
            alt="预览图"
            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
          />
        </Paper>
      )}

      {result && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography 
            variant="h6"
            sx={{ 
              color: result.status === 'approved' ? 'success.main' : 'error.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            审核结果: {result.status === 'approved' ? '通过' : '违规'}
          </Typography>
          {result.reason && result.status !== 'approved' && (
            <Typography color="error" sx={{ mt: 1 }}>
              违规原因: {result.reason}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
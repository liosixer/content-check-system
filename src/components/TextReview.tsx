'use client';

import { useState } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';

export default function TextReview() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<{
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
  } | null>(null);

  const handleSubmit = async () => {
    try {
      // 这里调用您的API
      const response = await fetch('/api/text-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('审核请求失败:', error);
    }
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请输入需要审核的文本"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!text.trim()}
        >
          提交审核
        </Button>
      </Paper>

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
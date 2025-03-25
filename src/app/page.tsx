'use client';

import { useState } from 'react';
import { Tabs, Tab, Box, Container } from '@mui/material';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const TextReview = dynamic(() => import('@/components/TextReview'), {
  loading: () => <p>加载中...</p>
});

const ImageReview = dynamic(() => import('@/components/ImageReview'), {
  loading: () => <p>加载中...</p>
});

export default function Home() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="content review tabs"
        >
          <Tab label="文本审核" />
          <Tab label="图像审核" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Suspense fallback={<div>加载中...</div>}>
              <TextReview />
            </Suspense>
          )}
          {tabValue === 1 && (
            <Suspense fallback={<div>加载中...</div>}>
              <ImageReview />
            </Suspense>
          )}
        </Box>
      </Box>
    </Container>
  );
} 
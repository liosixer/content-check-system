'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Papa from 'papaparse';

interface Rule {
  ruleId: string;
  content: string;
  description: string;
}

interface CsvRow {
  规则ID: string;
  规则内容: string;
  描述: string;
}

export default function TextReview() {
  const [text, setText] = useState('');
  const [rules, setRules] = useState<Rule[]>([]);
  const [result, setResult] = useState<{
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
  } | null>(null);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = () => {
    fetch('/ec_ccs/assets/text_check.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse<CsvRow>(csvText, {
          header: true,
          complete: (results) => {
            const parsedRules = results.data.map((row) => ({
              ruleId: row['规则ID'],
              content: row['规则内容'],
              description: row['描述']
            }));
            setRules(parsedRules);
          }
        });
      })
      .catch(error => {
        console.error('加载规则文件失败:', error);
        showSnackbar('加载规则文件失败', 'error');
      });
  };

  const handleEditClick = (rule: Rule) => {
    setEditingRule(rule);
    setEditContent(rule.content);
    setEditDescription(rule.description);
    setEditDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;

    try {
      // 更新本地状态
      const updatedRules = rules.map(rule => 
        rule.ruleId === editingRule.ruleId 
          ? { ...rule, content: editContent, description: editDescription }
          : rule
      );
      setRules(updatedRules);

      // 转换为CSV格式
      const csvContent = [
        ['规则ID', '规则内容', '描述'],
        ...updatedRules.map(rule => [rule.ruleId, rule.content, rule.description])
      ].map(row => row.join(',')).join('\n');

      // 保存到服务器
      const response = await fetch('/ec_ccs/api/save-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: csvContent }),
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      setEditDialogOpen(false);
      showSnackbar('规则保存成功', 'success');
    } catch (error) {
      console.error('保存规则失败:', error);
      showSnackbar('保存规则失败', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const checkLocalRules = (text: string): { matched: boolean; rule?: Rule; matchedKeyword?: string } => {
    for (const rule of rules) {
      const keywords = rule.content.split(' ');
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return { matched: true, rule, matchedKeyword: keyword };
        }
      }
    }
    return { matched: false };
  };

  const handleSubmit = async () => {
    try {
      const localCheck = checkLocalRules(text);
      if (localCheck.matched && localCheck.rule) {
        setResult({
          status: 'rejected',
          reason: `违反规则: ${localCheck.rule.description} (匹配关键词: ${localCheck.matchedKeyword})`
        });
        return;
      }

      const response = await fetch('/ec_ccs/api/text-review', {
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

      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          自定义规则列表
        </Typography>
        <List>
          {rules.map((rule, index) => (
            <div key={rule.ruleId}>
              <ListItem
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleEditClick(rule)}>
                    <EditIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`规则 ${rule.ruleId}: ${rule.content}`}
                  secondary={rule.description}
                />
              </ListItem>
              {index < rules.length - 1 && <Divider />}
            </div>
          ))}
        </List>
      </Paper>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>编辑规则</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="规则内容"
            fullWidth
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            helperText="多个关键词请用空格分隔"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="规则描述"
            fullWidth
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveRule} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 
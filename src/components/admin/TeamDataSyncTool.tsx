/**
 * 團隊資料同步工具元件
 * 用於管理員檢查和修復團隊成員資料不一致的問題
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import {
  checkTeamDataConsistency,
  syncOrganizationTeamData,
  syncUserTeams,
  syncTeamMembers
} from '../../utils/team-data-sync';

export const TeamDataSyncTool: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [inconsistencies, setInconsistencies] = useState<Array<{
    type: 'user_missing_team' | 'team_missing_user';
    userId: string;
    teamId: string;
    userName?: string;
    teamName?: string;
  }>>([]);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [expanded, setExpanded] = useState(true);

  // 檢查資料一致性
  const handleCheckConsistency = async () => {
    if (!user?.organizationId) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await checkTeamDataConsistency(user.organizationId);
      setInconsistencies(result.inconsistencies);
      
      if (result.inconsistencies.length === 0) {
        setMessage({
          type: 'success',
          text: '✅ 團隊資料完全一致，無需同步！'
        });
      } else {
        setMessage({
          type: 'info',
          text: `發現 ${result.inconsistencies.length} 個資料不一致的情況`
        });
      }
    } catch (error) {
      console.error('檢查資料一致性失敗:', error);
      setMessage({
        type: 'error',
        text: '檢查失敗，請稍後再試'
      });
    } finally {
      setLoading(false);
    }
  };

  // 執行完整同步
  const handleFullSync = async () => {
    if (!user?.organizationId) return;
    
    setSyncing(true);
    setMessage(null);
    
    try {
      await syncOrganizationTeamData(user.organizationId);
      setMessage({
        type: 'success',
        text: '✅ 團隊資料同步完成！'
      });
      
      // 重新檢查一致性
      await handleCheckConsistency();
    } catch (error) {
      console.error('同步失敗:', error);
      setMessage({
        type: 'error',
        text: '同步失敗，請稍後再試'
      });
    } finally {
      setSyncing(false);
    }
  };

  // 同步單一項目
  const handleSyncItem = async (item: typeof inconsistencies[0]) => {
    setMessage(null);
    
    try {
      if (item.type === 'user_missing_team') {
        await syncUserTeams(item.userId);
      } else {
        await syncTeamMembers(item.teamId);
      }
      
      setMessage({
        type: 'success',
        text: '✅ 項目同步成功'
      });
      
      // 重新檢查一致性
      await handleCheckConsistency();
    } catch (error) {
      console.error('同步項目失敗:', error);
      setMessage({
        type: 'error',
        text: '同步失敗，請稍後再試'
      });
    }
  };

  // 根據類型獲取圖示和說明
  const getInconsistencyInfo = (type: string) => {
    if (type === 'user_missing_team') {
      return {
        icon: <PersonAddIcon />,
        color: 'warning' as const,
        description: '使用者的 teamIds 缺少此團隊'
      };
    } else {
      return {
        icon: <GroupAddIcon />,
        color: 'info' as const,
        description: '團隊的 memberIds 缺少此使用者'
      };
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">團隊資料同步工具</Typography>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Typography variant="body2" color="textSecondary" mb={3}>
            此工具用於檢查和修復使用者團隊資料（User.teamIds 和 Team.memberIds）的不一致問題。
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={handleCheckConsistency}
              disabled={loading || syncing}
            >
              檢查一致性
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<SyncIcon />}
              onClick={handleFullSync}
              disabled={syncing || loading || inconsistencies.length === 0}
            >
              執行完整同步
            </Button>
          </Box>

          {(loading || syncing) && <LinearProgress sx={{ mb: 2 }} />}

          {inconsistencies.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                發現的不一致項目：
              </Typography>
              
              <List>
                {inconsistencies.map((item, index) => {
                  const info = getInconsistencyInfo(item.type);
                  return (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <Button
                          size="small"
                          startIcon={<SyncIcon />}
                          onClick={() => handleSyncItem(item)}
                          disabled={syncing}
                        >
                          同步
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              size="small"
                              icon={info.icon}
                              label={item.type}
                              color={info.color}
                            />
                            <Typography variant="body2">
                              {item.userName || item.userId} - {item.teamName || item.teamId}
                            </Typography>
                          </Box>
                        }
                        secondary={info.description}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}

          {inconsistencies.length === 0 && !loading && (
            <Box textAlign="center" py={3}>
              <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                資料檢查完成，所有團隊成員資料都是一致的！
              </Typography>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};
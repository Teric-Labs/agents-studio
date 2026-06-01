import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Upload, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  HardDrive,
  Plus,
  X,
  Search,
  FileText,
  MoreVertical
} from 'lucide-react';
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  Card, 
  Table, 
  Spinner,
  Callout,
  Dialog,
  AlertDialog,
  Heading,
  TextField,
  Popover,
  IconButton
} from '@radix-ui/themes';


const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface FileInfo {
  name: string;
  size: number;
  modified: string;
}

export const KnowledgeBaseManager: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/knowledge/files`);
      setFiles(response.data);
    } catch (err: any) {
      console.error('Failed to fetch files:', err);
      setError('Could not load knowledge base files.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_BASE}/knowledge/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMessage(`${file.name} uploaded successfully.`);
      fetchFiles();
      
      // Auto-clear success message
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError('Failed to upload document.');
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    setError(null);
    try {
      await axios.delete(`${API_BASE}/knowledge/files/${filename}`);
      setFiles(prev => prev.filter(f => f.name !== filename));
      setSuccessMessage('File deleted.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError('Failed to delete file.');
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    setError(null);
    try {
      await axios.post(`${API_BASE}/knowledge/reindex`);
      setSuccessMessage('Re-indexing started in background.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Re-index failed:', err);
      setError('Failed to trigger re-index.');
    } finally {
      setIsReindexing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseFloat(timestamp) * 1000).toLocaleString();
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Card size="2" style={{ borderRadius: 'var(--radius-2)', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <Flex direction="column" gap="5">
        {/* Header - Global Standard Header for Management Views */}
        <Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'stretch', md: 'center' }} gap="4">
          <Box>
            <Heading size={{ initial: '3', md: '4' }} mb="1" style={{ color: '#111827', fontWeight: 800 }}>Knowledge Base</Heading>
            <Text size={{ initial: '1', md: '2' }} style={{ color: '#111827' }}>Upload and manage documents for RAG indexing</Text>
          </Box>
          <Flex gap="3" direction={{ initial: 'column', md: 'row' }} align={{ initial: 'stretch', md: 'center' }}>
            <TextField.Root placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} size="2">
              <TextField.Slot><Search size={14} /></TextField.Slot>
            </TextField.Root>
            
            <Dialog.Root open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <Dialog.Trigger>
                <Button size="2" variant="solid" style={{ backgroundColor: '#f0ad44', color: '#211d1e' }}>
                  <Plus size={16} /> Upload Document
                </Button>
              </Dialog.Trigger>
              <Dialog.Content maxWidth="520px" style={{ border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)' }}>
                <Box>
                  <Flex align="center" gap="3" mb="1">
                    <Box p="2" style={{ backgroundColor: '#fffbeb', color: '#92400e', borderRadius: 'var(--radius-3)' }}>
                      <HardDrive size={24} />
                    </Box>
                    <Dialog.Title style={{ margin: 0, fontWeight: 800, fontSize: '24px', letterSpacing: '-0.02em', color: '#111827' }}>
                      Upload Knowledge
                    </Dialog.Title>
                  </Flex>
                  <Dialog.Description size="2" style={{ color: '#111827' }}>
                    Expand your agent's universe. Add documents to power its long-term memory and RAG capabilities.
                  </Dialog.Description>
                </Box>
                
                <Box position="relative" mt="4">
                  <input
                    type="file"
                    onChange={(e) => {
                      handleFileUpload(e);
                      setIsUploadDialogOpen(false);
                    }}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                    disabled={isUploading}
                  />
                  <Button 
                    variant="surface" 
                    color="amber" 
                    style={{ width: '100%', height: '120px', border: '2px dashed #fcd34d' }}
                  >
                    <Flex direction="column" align="center" gap="2">
                      {isUploading ? <Spinner size="3" /> : <Upload size={32} />}
                      <Text size="2" weight="bold">{isUploading ? 'Uploading...' : 'Click or Drop File'}</Text>
                      <Text size="1" style={{ color: '#111827' }}>Maximum file size: 50MB</Text>
                    </Flex>
                  </Button>
                </Box>
                
                <Flex gap="3" mt="5" justify="end">
                  <Dialog.Close>
                    <Button variant="outline" color="gray" style={{ cursor: 'pointer' }}>Cancel</Button>
                  </Dialog.Close>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>

            <Button variant="solid" style={{ backgroundColor: '#f0ad44', color: '#161617', fontWeight: 600, cursor: 'pointer' }} onClick={fetchFiles} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </Flex>
        </Flex>

        {/* Messaging Area - Local alerts within the card context */}
        {error && (
          <Callout.Root color="red" variant="soft" size="1">
            <Callout.Icon><AlertCircle size={18} /></Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}
        {successMessage && (
          <Callout.Root color="amber" variant="soft" size="1">
            <Callout.Icon><CheckCircle2 size={18} /></Callout.Icon>
            <Callout.Text>{successMessage}</Callout.Text>
          </Callout.Root>
        )}

        {/* Standardized Index Table */}
        <Box style={{ overflowX: 'auto', margin: '0 -4px' }}>
          <Table.Root variant="ghost" size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell style={{ fontSize: '12px' }}>FILENAME</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ fontSize: '12px' }}>TYPE</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ fontSize: '12px' }}>SIZE</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell style={{ fontSize: '12px' }}>LAST MODIFIED</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center" style={{ fontSize: '12px' }}>ACTIONS</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

          <Table.Body>
            {filteredFiles.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} align="center" style={{ padding: '60px 0' }}>
                  <Flex direction="column" align="center" gap="2">
                    <FileText size={32} color="#111827" />
                    <Text size="2" weight="medium" style={{ color: '#111827' }}>No documents indexed in your knowledge base.</Text>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredFiles.map((file) => {
                const extension = file.name.split('.').pop()?.toLowerCase() || '';
                const getFileTypeInfo = (ext: string) => {
                  switch(ext) {
                    case 'pdf': return { label: 'PDF', color: 'red' as const, icon: <FileText size={18} /> };
                    case 'xlsx': 
                    case 'xls': 
                    case 'csv': return { label: 'Excel/Data', color: 'orange' as const, icon: <HardDrive size={18} /> };
                    case 'doc':
                    case 'docx': return { label: 'Word', color: 'blue' as const, icon: <FileText size={18} /> };
                    case 'txt':
                    case 'md': return { label: 'Text', color: 'gray' as const, icon: <FileText size={18} /> };
                    default: return { label: 'Document', color: 'indigo' as const, icon: <FileText size={18} /> };
                  }
                };
                const typeInfo = getFileTypeInfo(extension);

                return (
                  <Table.Row key={file.name} align="center" className="hoverable-row">
                    <Table.Cell>
                      <Text weight="bold" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{file.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ 
                        color: typeInfo.color === 'red' ? '#ef4444' : typeInfo.color === 'blue' ? '#3b82f6' : typeInfo.color === 'orange' ? '#f97316' : typeInfo.color === 'indigo' ? '#6366f1' : '#f0ad44', 
                        fontWeight: 800, 
                        fontSize: '10px', 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        whiteSpace: 'nowrap', 
                        border: `1px solid ${typeInfo.color === 'red' ? 'rgba(239, 68, 68, 0.2)' : typeInfo.color === 'blue' ? 'rgba(59, 130, 246, 0.2)' : typeInfo.color === 'orange' ? 'rgba(249, 115, 22, 0.2)' : typeInfo.color === 'indigo' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(240, 173, 68, 0.2)'}`, 
                        backgroundColor: `${typeInfo.color === 'red' ? 'rgba(239, 68, 68, 0.05)' : typeInfo.color === 'blue' ? 'rgba(59, 130, 246, 0.05)' : typeInfo.color === 'orange' ? 'rgba(249, 115, 22, 0.05)' : typeInfo.color === 'indigo' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(240, 173, 68, 0.05)'}`
                      }}>
                        {extension || 'FILE'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ 
                        color: '#f0ad44', 
                        fontWeight: 800, 
                        fontSize: '10px', 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        whiteSpace: 'nowrap', 
                        border: '1px solid rgba(240, 173, 68, 0.2)', 
                        backgroundColor: 'rgba(240, 173, 68, 0.05)' 
                      }}>
                        {formatSize(file.size)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Text style={{ color: '#111827', fontSize: '12px' }}>{formatDate(file.modified)}</Text>
                    </Table.Cell>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Flex gap="2" justify="center" align="center">
                        <Popover.Root>
                          <Popover.Trigger onClick={(e) => e.stopPropagation()}>
                            <IconButton variant="ghost" color="gray" style={{ cursor: 'pointer' }}>
                              <MoreVertical size={16} />
                            </IconButton>
                          </Popover.Trigger>
                          <Popover.Content size="1" style={{ padding: '4px' }} onClick={(e) => e.stopPropagation()}>
                            <AlertDialog.Root>
                              <AlertDialog.Trigger onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" color="red" size="1" style={{ width: '100%', justifyContent: 'start', cursor: 'pointer' }}>
                                  <Trash2 size={14} style={{ marginRight: '6px' }} /> Remove Document
                                </Button>
                              </AlertDialog.Trigger>
                              <AlertDialog.Content maxWidth="450px" style={{ border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)' }}>
                                <AlertDialog.Title style={{ fontWeight: 800, color: '#111827' }}>Delete Document</AlertDialog.Title>
                                <AlertDialog.Description size="2" style={{ color: '#111827' }}>
                                  Are you sure? This document will be permanently removed from the agent's memory and knowledge base indexing.
                                </AlertDialog.Description>
                                <Flex gap="3" mt="4" justify="end" align="center">
                                  <AlertDialog.Cancel onClick={(e) => e.stopPropagation()}>
                                    <Button variant="outline" color="gray" style={{ cursor: 'pointer' }}><X size={16}/> Cancel</Button>
                                  </AlertDialog.Cancel>
                                  <AlertDialog.Action onClick={(e) => e.stopPropagation()}>
                                    <Button variant="solid" color="red" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}><Trash2 size={16}/> Delete</Button>
                                  </AlertDialog.Action>
                                </Flex>
                              </AlertDialog.Content>
                            </AlertDialog.Root>
                          </Popover.Content>
                        </Popover.Root>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
        </Box>

        {/* Global Toolbar Footer */}
        <Flex direction={{ initial: 'column', sm: 'row' }} justify="between" align={{ initial: 'start', sm: 'center' }} gap="4" pt="2" style={{ borderTop: '1px solid #e5e7eb' }}>
          <Text size="1" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
            <AlertCircle size={14} /> 
            Vector embeddings are updated automatically on every upload.
          </Text>
          <Button variant="solid" style={{ backgroundColor: '#f0ad44', color: '#161617', fontWeight: 600, cursor: 'pointer' }} size="1" onClick={handleReindex} disabled={isReindexing}>
            <RefreshCw size={14} className={isReindexing ? 'animate-spin' : ''} /> Force Global Re-Index
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

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
  FileText
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
  Badge,
  TextField
} from '@radix-ui/themes';


const API_BASE = 'http://localhost:8000';

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
    <Card size="2">
      <Flex direction="column" gap="5">
        {/* Header - Global Standard Header for Management Views */}
        <Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'stretch', md: 'center' }} gap="4">
          <Box>
            <Heading size={{ initial: '3', md: '4' }} mb="1" style={{ color: '#1e293b', fontWeight: 800 }}>Knowledge Base</Heading>
            <Text size={{ initial: '1', md: '2' }} color="gray">Upload and manage documents for RAG indexing</Text>
          </Box>
          <Flex gap="3" direction={{ initial: 'column', md: 'row' }} align={{ initial: 'stretch', md: 'center' }}>
            <TextField.Root placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} size="2">
              <TextField.Slot><Search size={14} /></TextField.Slot>
            </TextField.Root>
            
            <Dialog.Root open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <Dialog.Trigger>
                <Button color="teal" size="2" variant="solid">
                  <Plus size={16} /> Upload Document
                </Button>
              </Dialog.Trigger>
              <Dialog.Content maxWidth="520px">
                <Box>
                  <Flex align="center" gap="3" mb="1">
                    <Box p="2" style={{ backgroundColor: 'var(--teal-3)', color: 'var(--teal-9)', borderRadius: 'var(--radius-3)' }}>
                      <HardDrive size={24} />
                    </Box>
                    <Dialog.Title style={{ margin: 0, fontWeight: 800, fontSize: '24px', letterSpacing: '-0.02em', color: '#1e293b' }}>
                      Upload Knowledge
                    </Dialog.Title>
                  </Flex>
                  <Dialog.Description size="2">
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
                    color="teal" 
                    style={{ width: '100%', height: '120px', border: '2px dashed var(--teal-5)' }}
                  >
                    <Flex direction="column" align="center" gap="2">
                      {isUploading ? <Spinner size="3" /> : <Upload size={32} />}
                      <Text size="2" weight="bold">{isUploading ? 'Uploading...' : 'Click or Drop File'}</Text>
                      <Text size="1" color="gray">Maximum file size: 50MB</Text>
                    </Flex>
                  </Button>
                </Box>
                
                <Flex gap="3" mt="5" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">Cancel</Button>
                  </Dialog.Close>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>

            <Button variant="soft" color="gray" onClick={fetchFiles} disabled={isLoading}>
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
          <Callout.Root color="green" variant="soft" size="1">
            <Callout.Icon><CheckCircle2 size={18} /></Callout.Icon>
            <Callout.Text>{successMessage}</Callout.Text>
          </Callout.Root>
        )}

        {/* Standardized Index Table */}
        <Box style={{ overflowX: 'auto', margin: '0 -4px' }}>
          <Table.Root variant="ghost" size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>FILENAME</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>TYPE</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>SIZE</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>LAST MODIFIED</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">ACTIONS</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

          <Table.Body>
            {filteredFiles.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} align="center" style={{ padding: '60px 0' }}>
                  <Flex direction="column" align="center" gap="2">
                    <FileText size={32} color="#94a3b8" />
                    <Text color="gray" size="2" weight="medium">No documents indexed in your knowledge base.</Text>
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
                    case 'csv': return { label: 'Excel/Data', color: 'green' as const, icon: <HardDrive size={18} /> };
                    case 'doc':
                    case 'docx': return { label: 'Word', color: 'blue' as const, icon: <FileText size={18} /> };
                    case 'txt':
                    case 'md': return { label: 'Text', color: 'gray' as const, icon: <FileText size={18} /> };
                    default: return { label: 'Document', color: 'indigo' as const, icon: <FileText size={18} /> };
                  }
                };
                const typeInfo = getFileTypeInfo(extension);

                return (
                  <Table.Row key={file.name} align="center">
                    <Table.Cell>
                      <Flex align="center" gap="3">
                        <Box p="2" style={{ backgroundColor: `var(--${typeInfo.color}-3)`, borderRadius: 'var(--radius-2)' }}>
                          {React.cloneElement(typeInfo.icon as React.ReactElement, { color: `var(--${typeInfo.color}-11)` })}
                        </Box>
                        <Box>
                          <Text size="2" weight="bold" as="div">{file.name}</Text>
                          <Text size="1" color="gray">{typeInfo.label}</Text>
                        </Box>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={typeInfo.color} variant="soft" radius="full" style={{ textTransform: 'uppercase', fontWeight: 800 }}>
                        {extension || 'FILE'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="gray" variant="surface" radius="full">{formatSize(file.size)}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">{formatDate(file.modified)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2" justify="center" align="center">
                        <AlertDialog.Root>
                          <AlertDialog.Trigger>
                            <Button size="1" variant="ghost" color="red"><Trash2 size={14} /> Remove</Button>
                          </AlertDialog.Trigger>
                          <AlertDialog.Content maxWidth="450px">
                            <AlertDialog.Title style={{ fontWeight: 800, color: '#1e293b' }}>Delete Document</AlertDialog.Title>
                            <AlertDialog.Description size="2">
                              Are you sure? This document will be permanently removed from the agent's memory and knowledge base indexing.
                            </AlertDialog.Description>
                            <Flex gap="3" mt="4" justify="end" align="center">
                              <AlertDialog.Cancel><Button variant="soft" color="gray"><X size={16}/> Cancel</Button></AlertDialog.Cancel>
                              <AlertDialog.Action>
                                <Button variant="solid" color="red" onClick={() => handleDelete(file.name)}><Trash2 size={16}/> Delete</Button>
                              </AlertDialog.Action>
                            </Flex>
                          </AlertDialog.Content>
                        </AlertDialog.Root>
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
        <Flex direction={{ initial: 'column', sm: 'row' }} justify="between" align={{ initial: 'start', sm: 'center' }} gap="4" pt="2" style={{ borderTop: '1px solid var(--gray-4)' }}>
          <Text size="1" color="gray" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={14} /> 
            Vector embeddings are updated automatically on every upload.
          </Text>
          <Button variant="soft" color="teal" size="1" onClick={handleReindex} disabled={isReindexing}>
            <RefreshCw size={14} className={isReindexing ? 'animate-spin' : ''} /> Force Global Re-Index
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

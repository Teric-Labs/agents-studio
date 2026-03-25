import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Upload, 
  Trash2, 
  RefreshCw, 
  File, 
  CheckCircle2, 
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  Card, 
  Table, 
  IconButton, 
  Spinner,
  Separator,
  Callout,
  Grid
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
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

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

  return (
    <Box p="4">
      <Flex direction="column" gap="4">
        {/* Header and Status */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <HardDrive size={24} color="var(--accent-9)" />
            <Box>
              <Text weight="bold" size="4">Documents Knowledge Base</Text>
              <Text size="2" color="gray">Power your agent with external data & RAG</Text>
            </Box>
          </Flex>
          <Flex gap="2">
            <Button variant="outline" color="gray" onClick={fetchFiles} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="soft" color="indigo" onClick={handleReindex} disabled={isReindexing}>
              <RefreshCw size={16} className={isReindexing ? 'animate-spin' : ''} />
              Re-Index All
            </Button>
          </Flex>
        </Flex>

        <Separator size="4" />

        {/* Messaging Area */}
        {error && (
          <Callout.Root color="red" variant="soft">
            <Callout.Icon><AlertCircle size={18} /></Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}
        {successMessage && (
          <Callout.Root color="green" variant="soft">
            <Callout.Icon><CheckCircle2 size={18} /></Callout.Icon>
            <Callout.Text>{successMessage}</Callout.Text>
          </Callout.Root>
        )}

        <Grid columns={{ initial: '1', md: '3' }} gap="4">
          {/* Upload Section */}
          <Card size="2">
            <Flex direction="column" gap="3">
              <Text weight="bold" size="3" mb="1">Upload Documents</Text>
              <Text size="1" color="gray">Add PDF, TXT, or DOCX files to the agent's memory.</Text>
              
              <Box position="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                  disabled={isUploading}
                />
                <Button 
                  variant="surface" 
                  color="indigo" 
                  style={{ width: '100%', height: '80px', border: '2px dashed var(--indigo-5)' }}
                >
                  <Flex direction="column" align="center" gap="1">
                    {isUploading ? <Spinner size="3" /> : <Upload size={24} />}
                    <Text size="2">{isUploading ? 'Uploading...' : 'Drop file or click here'}</Text>
                  </Flex>
                </Button>
              </Box>
            </Flex>
          </Card>

          {/* Files List Section */}
          <Box style={{ gridColumn: 'span 2' }}>
            <Card variant="surface" style={{ padding: 0 }}>
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Filename</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Size</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Last Modified</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell align="right">Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {files.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={4} align="center" style={{ height: '100px' }}>
                        <Text color="gray" size="2">No documents indexed yet.</Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    files.map((file) => (
                      <Table.Row key={file.name}>
                        <Table.RowHeaderCell>
                          <Flex align="center" gap="2">
                            <File size={16} color="var(--gray-9)" />
                            <Text size="2" weight="medium">{file.name}</Text>
                          </Flex>
                        </Table.RowHeaderCell>
                        <Table.Cell>
                          <Text size="1" color="gray">{formatSize(file.size)}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="1" color="gray">{formatDate(file.modified)}</Text>
                        </Table.Cell>
                        <Table.Cell align="right">
                          <IconButton size="1" variant="ghost" color="red" onClick={() => handleDelete(file.name)}>
                            <Trash2 size={14} />
                          </IconButton>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Card>
          </Box>
        </Grid>

        <Box>
            <Callout.Root color="indigo" variant="outline">
                <Callout.Icon><AlertCircle size={18} /></Callout.Icon>
                <Callout.Text size="1">
                    The knowledge base uses LlamaIndex for RAG. Uploaded documents are automatically chunked and indexed. 
                    Re-indexing might take a few moments for large files.
                </Callout.Text>
            </Callout.Root>
        </Box>
      </Flex>
    </Box>
  );
};

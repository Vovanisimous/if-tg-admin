import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRowModel } from '@mui/x-data-grid';
import { supabase } from '../supabaseClient';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { Visitor } from '../models/visitor';

const PAGE_SIZE = 10;

const VisitorsPage: React.FC = () => {
  const [rows, setRows] = useState<Visitor[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<any>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchVisitors = async (page: number, filters: any) => {
    setLoading(true);
    let query = supabase.from('visitors').select('*', { count: 'exact' });
    // Сортируем по дате создания, чтобы новые посетители были первыми
    query = query.order('creation_date', { ascending: false });
    // Pagination
    query = query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    const { data, error, count } = await query;
    if (!error) {
      setRows(data || []);
      setRowCount(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVisitors(page, filters);
    // eslint-disable-next-line
  }, [page, filters]);

  // Realtime подписка на изменения в таблице visitors
  useEffect(() => {
    const channel = supabase
      .channel('visitors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, () => {
        fetchVisitors(page, filters);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, [page, filters]);

  const handleProcessRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    try {
      // Обновляем только поле comment
      const { error } = await supabase
        .from('visitors')
        .update({ comment: newRow.comment || null })
        .eq('id', newRow.id);

      if (error) throw error;

      setSnackbar({ open: true, message: 'Комментарий обновлен', severity: 'success' });
      return newRow;
    } catch (error) {
      console.error('Error updating comment:', error);
      setSnackbar({ open: true, message: 'Ошибка при обновлении комментария', severity: 'error' });
      return oldRow;
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, filterable: true },
    { field: 'username', headerName: 'Username', width: 160, filterable: true },
    { field: 'name', headerName: 'Имя в телеграме', width: 160, filterable: true },
    {
      field: 'real_name',
      headerName: 'Имя',
      width: 160,
      filterable: true,
      valueFormatter: (value: string) => (value ? value : '-'),
    },
    {
      field: 'creation_date',
      headerName: 'Дата создания',
      width: 180,
      filterable: true,
      valueFormatter: (value: string) => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        });
      },
    },
    {
      field: 'last_visit_date',
      headerName: 'Последний визит',
      width: 180,
      filterable: true,
      valueFormatter: (value: string) => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        });
      },
    },
    {
      field: 'comment',
      headerName: 'Комментарий',
      width: 250,
      editable: true,
      filterable: true,
      renderCell: (params) => {
        const value = params.value as string | null;
        return value ? value : '';
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Посетители
      </Typography>
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          paginationModel={{ page, pageSize: PAGE_SIZE }}
          onPaginationModelChange={(model) => setPage(model.page)}
          pagination
          paginationMode="server"
          loading={loading}
          slots={{ toolbar: GridToolbar }}
          filterMode="client"
          initialState={{
            sorting: {
              sortModel: [{ field: 'creation_date', sort: 'desc' }],
            },
          }}
          onFilterModelChange={(model) => {
            setFilters(model);
            setPage(0);
          }}
          processRowUpdate={handleProcessRowUpdate}
          onProcessRowUpdateError={(error) => {
            console.error('Error processing row update:', error);
            setSnackbar({ open: true, message: 'Ошибка при обновлении', severity: 'error' });
          }}
        />
      </div>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VisitorsPage;

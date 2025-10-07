import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { supabase } from '../supabaseClient';
import { Box, Typography } from '@mui/material';
import { Booking } from '../models/booking';

const PAGE_SIZE = 10;

const BookingsPage: React.FC = () => {
  const [rows, setRows] = useState<Booking[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<any>({});

  const fetchBookings = async (page: number, filters: any) => {
    setLoading(true);
    // Получаем данные с join visitors
    let query = supabase
      .from('bookings')
      .select('*, visitors:userid (username, real_name)', { count: 'exact' });
    // Pagination
    query = query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    const { data, error, count } = await query;

    console.log(data);

    if (!error) {
      // Преобразуем данные, чтобы добавить username и real_name в строки
      const rowsWithVisitor = (data || []).map((row: any) => ({
        ...row,
        username: row.visitors?.username || '',
        real_name: row.visitors?.real_name || '',
      }));
      setRows(rowsWithVisitor);
      setRowCount(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings(page, filters);
    // eslint-disable-next-line
  }, [page, filters]);

  // Realtime подписка на изменения в таблице bookings
  useEffect(() => {
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings(page, filters);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, [page, filters]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, filterable: true },
    { field: 'userid', headerName: 'ID в телеграме', width: 120, filterable: true },
    { field: 'username', headerName: 'Username', width: 160, filterable: true },
    { field: 'real_name', headerName: 'Имя', width: 160, filterable: true },
    {
      field: 'date',
      headerName: 'Дата',
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
    { field: 'visitors_count', headerName: 'Кол-во гостей', width: 120, filterable: true },
    {
      field: 'phone',
      headerName: 'Телефон',
      width: 160,
      filterable: true,
      renderCell: (params) => {
        const value = params.value as string | null;
        if (!value) return '-';
        const tel = value.replace(/[\s()-]/g, '');
        return <a href={`tel:${tel}`}>{value}</a>;
      },
    },
    {
      field: 'status',
      headerName: 'Статус',
      width: 160,
      filterable: true,
      valueFormatter: (value: string) => {
        if (!value) return '';
        return value === 'active'
          ? 'Активно'
          : value === 'completed'
            ? 'Завершено'
            : value === 'canceled'
              ? 'Отменен'
              : value === 'confirmed'
                ? 'Подтверждено'
                : 'В ожидании';
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Бронирования
      </Typography>
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          paginationModel={{ page, pageSize: PAGE_SIZE }}
          onPaginationModelChange={(model) => setPage(model.page)}
          pagination
          paginationMode="client"
          loading={loading}
          slots={{ toolbar: GridToolbar }}
          filterMode="client"
          initialState={{
            sorting: {
              sortModel: [{ field: 'id', sort: 'desc' }],
            },
          }}
          onFilterModelChange={(model) => {
            setFilters(model);
            setPage(0);
          }}
        />
      </div>
    </Box>
  );
};

export default BookingsPage;

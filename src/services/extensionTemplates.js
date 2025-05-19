// Extension entry point templates for Vue and React (JSX, TSX)

const vueContent = `
<template>
  <div class="minimal-vue-app">
    <div class="styled-paper">
      <h1>{{ title }}</h1>
      <p>{{ message }}</p>
      <button @click="showSnackbar" class="action-button">
        Show Quoti Snackbar (Vue)
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MinimalVueApp',
  props: {
    QuotiVue: { type: Object, default: () => ({}) },
    QuotiApi: { type: Object, default: () => ({}) },
    QuotiStore: { type: Object, default: () => ({}) },
    QuotiConfigs: { type: Object, default: () => ({}) },
    QueryParams: { type: Object, default: () => ({}) },
    QuotiRouter: { type: Object, default: () => ({}) } // Assuming QuotiRouter might be used
  },
  data() {
    return {
      title: 'Minimal Vue Extension',
      message: 'Minimal Vue App Initialized!'
    }
  },
  mounted() {
    this.message = 'Minimal Vue App Loaded with extended props.';
  },
  methods: {
    showSnackbar() {
      // também é possível utilizar this.$store
      if (this.QuotiStore && this.QuotiStore.dispatch) {
        this.QuotiStore.dispatch(
          'snackbar/success',
          '[VUE] Parabéns, você acessou a store do Quoti!'
        )
      } else {
        console.error('QuotiStore or dispatch method is not available.');
        this.message = 'Error: QuotiStore not available to dispatch snackbar.';
      }
    },
    emitRecreateEvent() {
      this.$emit('recreate');
      console.log("'recreate' event emitted to parent component.");
    }
  }
}
</script>

<style scoped>
.minimal-vue-app {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  background-color: #f0f2f5; /* Light gray background */
  width: 100%;
  box-sizing: border-box;
}

.styled-paper {
  background-color: #ffffff; /* White paper background */
  padding: 24px;
  border-radius: 8px; /* Softer corners */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Softer shadow */
  text-align: center;
  width: 100%;
  max-width: 600px; /* Max width for the content area */
}

.styled-paper h1 {
  color: #333; /* Darker heading for better contrast */
  font-weight: 600;
  margin-bottom: 16px;
}

.styled-paper p {
  color: #555; /* Slightly lighter paragraph text */
  margin-bottom: 24px;
}

.action-button {
  background-color: #1976d2; /* Primary button color (blue) */
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.action-button:hover {
  background-color: #155a9e; /* Darker blue on hover */
}
</style>
`

const reactTsxContent = `
import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Button,
  Paper,
  Box
} from '@mui/material'

import { createTheme, ThemeProvider, styled } from '@mui/material/styles'

// Define a simple theme for customization
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600
    }
  }
})

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2, 0), // Apply vertical margin, remove horizontal if container is full width
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  width: '100%'
}))

interface MinimalAppProps {
  QuotiVue?: any;
  QuotiApi?: any;
  QuotiStore?: any;
  QuotiConfigs?: any;
  QueryParams?: any;
  QuotiRouter?: any;
  onRecreate?: () => void;
}

const MinimalReactApp: React.FC<MinimalAppProps> = ({
  QuotiVue,
  QuotiApi,
  QuotiStore,
  QuotiConfigs,
  QueryParams,
  QuotiRouter,
  onRecreate,
}) => {
  const [message, setMessage] = useState<string>('Minimal React App Initialized!');

  useEffect(() => {
    // You can use QuotiRouter for navigation or QuotiStore to dispatch actions/read state here
    // You can call onRecreate() if needed, for example, based on some internal state change or event.
    setMessage('Minimal React App Loaded with extended props and logged them.');
  }, [QuotiVue, QuotiApi, QuotiStore, QuotiConfigs, QueryParams, QuotiRouter, onRecreate]);

  const handleClick = () => {
    QuotiStore.dispatch(
      'snackbar/success',
      '[REACT] Parabéns, você acessou a store do Quoti!'
    )
  }



  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth={false} sx={{ p: 0 }}>
        {' '}
        {/* Allow full width, remove default padding if StyledPaper has margin */}
        <StyledPaper elevation={3}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Minimal React Extension
          </Typography>
          <Typography variant="body1" align="center" sx={{ mt: 2, mb: 2 }}>
            {message}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleClick}>
              Show Quoti Snackbar
            </Button>
          </Box>
        </StyledPaper>
      </Container>
    </ThemeProvider>
  )
}

export default MinimalReactApp

`

module.exports = {
  vueContent,
  reactTsxContent
}

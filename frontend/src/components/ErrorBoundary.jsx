import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button, Card } from './ui';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console (and could send to error reporting service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-lg"
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
            >
              <AlertTriangle className="w-16 h-16 text-white" />
            </motion.div>

            {/* Error Message */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Something went wrong
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-8 leading-relaxed"
            >
              We encountered an unexpected error. Don't worry, this happens sometimes.
              Let's get you back to the voter registration movement!
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={this.handleReset}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="px-8 py-3 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Reload Page
                </Button>
              </div>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8"
                >
                  <Card className="p-4 bg-gray-100 border-gray-300">
                    <details className="text-left">
                      <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                        Error Details (Development)
                      </summary>
                      <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                        {this.state.error.toString()}
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

export default [
  {
    input: 'src/main.js',
    output: {
      file: 'dist/p5.ni.min.js',
      format: 'iife',
      minify: true
    }
  },
  {
    input: 'src/main.js',
    output: {
      file: 'dist/p5.ni.esm.js',
      format: 'esm'
    }
  }
];
var sum = 0;

if (process.argv.length > 2) for (i=2;i<process.argv.length;i++) sum += Number(process.argv[i]);

console.log(sum);


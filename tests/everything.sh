#!/bin/sh

set -e
set -x

srcdir=`dirname $0`/..

# build tests
$srcdir/tests/check-migrations.sh

# unit tests
node $srcdir/tests/unit

# integration tests
# (these spawn the whole system, with all the bells and whistles,
# and fire requests at it, checking the result)

$srcdir/tests/integration.sh

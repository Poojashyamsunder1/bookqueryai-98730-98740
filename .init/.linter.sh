#!/bin/bash
cd /home/kavia/workspace/code-generation/bookqueryai-98730-98740/pdf_qa_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


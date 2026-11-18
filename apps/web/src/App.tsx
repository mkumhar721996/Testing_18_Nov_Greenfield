import { useEffect, useState } from 'react'
import { getEmployee, type EmployeeRecordData } from './api/employees'
import EmployeeDirectory from './employees/EmployeeDirectory'
import EmployeeRecord from './employees/EmployeeRecord'

function RecordPage({ id, onBack }: { id: string; onBack: () => void }) {
  const [record, setRecord] = useState<EmployeeRecordData | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    getEmployee(id)
      .then(setRecord)
      .catch(() => setFailed(true))
  }, [id])

  return (
    <>
      <button type="button" className="chip" onClick={onBack}>
        Back to employees
      </button>
      {failed ? (
        <div className="alert alert-danger" role="alert">
          Could not load the employee.
        </div>
      ) : record === null ? (
        <div className="skeleton" role="status" aria-label="Loading employee" />
      ) : (
        <EmployeeRecord employee={record} approvals={record.approvals} />
      )}
    </>
  )
}

export default function App() {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <main style={{ maxWidth: 'var(--size-content)', margin: '0 auto', padding: 'var(--space-4)' }}>
      {openId === null ? (
        <EmployeeDirectory onOpen={setOpenId} />
      ) : (
        <RecordPage id={openId} onBack={() => setOpenId(null)} />
      )}
    </main>
  )
}

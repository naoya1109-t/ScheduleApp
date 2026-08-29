import type { ConnectionPool } from "mssql"
import type { CustomerMasterEntry, CustomerMasterRepository } from "./types.js"

// 得意先マスタの実体は別サーバー(10.194.5.55)にあるが、本アプリのDBサーバー
// (10.194.5.57)側に用意されるビュー経由で参照する(design.md 3-2章)。
// ビュー名・カラム名はDB側の準備が整い次第、正式名称に置き換える。
const CUSTOMER_MASTER_VIEW = "dbo.vw_customer_master"

interface CustomerMasterRow {
  customer_code: string
  customer_name: string
  sales_rep_id: number | null
}

function toEntry(row: CustomerMasterRow): CustomerMasterEntry {
  return { customerCode: row.customer_code, customerName: row.customer_name, salesRepId: row.sales_rep_id }
}

export class MssqlCustomerMasterRepository implements CustomerMasterRepository {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async search(query: string): Promise<CustomerMasterEntry[]> {
    try {
      const pool = await this.getPool()
      const result = await pool
        .request()
        .input("query", `%${query}%`).query<CustomerMasterRow>(`
          SELECT TOP 20 customer_code, customer_name, sales_rep_id
          FROM ${CUSTOMER_MASTER_VIEW}
          WHERE customer_code LIKE @query OR customer_name LIKE @query
          ORDER BY customer_name
        `)
      return result.recordset.map(toEntry)
    } catch (error) {
      // ビュー未整備の間はエラーにせず空配列を返し、フロントは手入力にフォールバックする
      console.warn(`得意先マスタ参照に失敗しました(${CUSTOMER_MASTER_VIEW}が未整備の可能性): ${(error as Error).message}`)
      return []
    }
  }

  async findByCode(customerCode: string): Promise<CustomerMasterEntry | undefined> {
    try {
      const pool = await this.getPool()
      const result = await pool
        .request()
        .input("customerCode", customerCode)
        .query<CustomerMasterRow>(`SELECT customer_code, customer_name, sales_rep_id FROM ${CUSTOMER_MASTER_VIEW} WHERE customer_code = @customerCode`)
      const row = result.recordset[0]
      return row ? toEntry(row) : undefined
    } catch (error) {
      console.warn(`得意先マスタ参照に失敗しました(${CUSTOMER_MASTER_VIEW}が未整備の可能性): ${(error as Error).message}`)
      return undefined
    }
  }
}

import { useState, useEffect } from "react";
import {
  Table, Button, Input, Tag, message, Tooltip, Spin,
} from "antd";
import {
  SearchOutlined, DownloadOutlined, EyeOutlined, ExportOutlined,
} from "@ant-design/icons";
import { getConversations, exportConversations } from "../services/system";

const ConversationManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchUser, setSearchUser] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const fetchData = async () => {
    try {
      var params = { page, pageSize: 10 };
      if (searchUser) params.username = searchUser;
      if (searchKeyword) params.keyword = searchKeyword;
      var res = await getConversations(params);
      setData(res.items || []);
      setTotal(res.total || 0);
    } catch(e) {
      console.error("Fetch conversations failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleSearch = function() { setPage(1); fetchData(); };

  const columns = [
    { title: "用户名", dataIndex: "username", key: "username", render: function(v) { return <span style={{ fontWeight: 500, color: "#f1f5f9" }}>{v}</span>; }},
    { title: "问题", dataIndex: "question", key: "question", render: function(v) { return <span style={{ color: "#94a3b8" }}>{v ? v.slice(0,30)+"..." : "-"}</span>; }},
    { title: "模型", dataIndex: "model_name", key: "model_name", render: function(v) { return <Tag color="blue">{v || "-"}</Tag>; }},
    { title: "创建时间", dataIndex: "created_at", key: "created_at", render: function(v) { return <span style={{ color: "#64748b" }}>{v || "-"}</span>; }},
    { title: "操作", key: "action", render: function(_, record) { return (
      <Tooltip title="展开详情">
        <Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 6, borderColor: "#334155", color: "#6366f1" }}
          onClick={function() { message.info("查看完整对话（开发中）"); }} />
      </Tooltip>
    );}},
  ];

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Input prefix={<SearchOutlined style={{ color: "#64748b" }} />} placeholder="搜索用户名..." value={searchUser}
            onChange={function(e) { setSearchUser(e.target.value); }} style={{ width: 160 }} allowClear />
          <Input prefix={<SearchOutlined style={{ color: "#64748b" }} />} placeholder="搜索关键词..." value={searchKeyword}
            onChange={function(e) { setSearchKeyword(e.target.value); }} style={{ width: 200 }} allowClear />
          <Button onClick={handleSearch} style={{ borderColor: "#334155", color: "#94a3b8" }}>搜索</Button>
        </div>
        <Button type="primary" icon={<DownloadOutlined />} style={{ borderRadius: 8, background: "#10b981", border: "none" }}
          onClick={function() {
            exportConversations({ username: searchUser, keyword: searchKeyword });
          }}>
          <ExportOutlined style={{ marginRight: 4 }} />导出 CSV
        </Button>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 12, border: "1px solid #334155", overflow: "hidden" }}>
        <Table dataSource={data} columns={columns} rowKey="id" pagination={{ current: page, pageSize: 10, total: total, onChange: setPage, showTotal: function(t) { return "共 " + t + " 条记录"; } }}
          size="middle" />
      </div>
    </div>
  );
};

export default ConversationManagement;
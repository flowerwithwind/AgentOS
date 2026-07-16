import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Switch, Select, Tag, Space, message, Popconfirm, Typography, Spin } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, RobotOutlined } from "@ant-design/icons";
import { getDigitalEmployees, createDigitalEmployee, updateDigitalEmployee, deleteDigitalEmployee } from "../services/digitalEmployees";

const DigitalEmployee = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      var res = await getDigitalEmployees({ page: 1, pageSize: 50, keyword: searchText });
      setData(res.items || []);
    } catch(e) {
      console.error("Fetch employees failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async function() {
    try {
      var values = await form.validateFields();
      setSaving(true);
      if (editingRecord) {
        await updateDigitalEmployee(editingRecord.id, values);
        message.success("已更新");
      } else {
        await createDigitalEmployee(values);
        message.success("已创建");
      }
      setModalOpen(false);
      setEditingRecord(null);
      form.resetFields();
      fetchData();
    } catch(e: any) {
      if (e?.message) message.error("操作失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async function(id) {
    try {
      await deleteDigitalEmployee(id);
      message.success("已删除");
      fetchData();
    } catch(e) {
      message.error("删除失败");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  const columns = [
    { title: "名称", dataIndex: "name", key: "name", render: function(t) { return <><RobotOutlined style={{ marginRight: 8, color: "#6366f1" }} /><span>{t}</span></>; }},
    { title: "欢迎语", dataIndex: "welcomeMessage", key: "welcomeMessage", ellipsis: true, render: function(v) { return <span style={{ color: "#94a3b8" }}>{v || "-"}</span>; }},
    { title: "状态", dataIndex: "status", key: "status", width: 80, render: function(s) { return <Switch checked={s === 1} size="small" />; }},
    { title: "技能", dataIndex: "skillNames", key: "skillNames", render: function(t) { return <Tag color="blue">{t || "-"}</Tag>; }},
    { title: "创建时间", dataIndex: "createAt", key: "createAt", render: function(v) { return <span style={{ color: "#64748b" }}>{v || "-"}</span>; }},
    { title: "操作", key: "actions", render: function(_, r) { return (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={function() { setEditingRecord(r); form.setFieldsValue(r); setModalOpen(true); }} />
        <Popconfirm title="确定删除?" onConfirm={function() { handleDelete(r.id); }}><Button type="link" danger icon={<DeleteOutlined />} /></Popconfirm>
      </Space>
    );}},
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Input prefix={<SearchOutlined />} placeholder="搜索名称..." value={searchText} onChange={function(e) { setSearchText(e.target.value); }} style={{ width: 300 }} allowClear />
        <Button type="primary" icon={<PlusOutlined />} onClick={function() { setEditingRecord(null); form.resetFields(); setModalOpen(true); }}>添加数字员工</Button>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, border: "1px solid #334155" }}>
        <Table columns={columns} dataSource={data} rowKey="id" pagination={false} />
      </div>
      <Modal title={editingRecord ? "编辑数字员工" : "添加数字员工"} open={modalOpen} onOk={handleSave} confirmLoading={saving} onCancel={function() { setModalOpen(false); setEditingRecord(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="welcomeMessage" label="欢迎语"><Input /></Form.Item>
          <Form.Item name="systemPrompt" label="系统提示词"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="status" label="状态"><Select options={[{ value: 1, label: "启用" }, { value: 0, label: "禁用" }]} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DigitalEmployee;
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LogOut, UserCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useAuth } from "../hooks/useAuth";
import api from "../lib/api";
import { Resident, VisitorLog } from "../types";

const visitorSchema = z.object({
  name: z.string().min(3),
  document: z.string().min(4),
  phone: z.string().optional(),
  visitReason: z.string().optional(),
  hostId: z.string().min(1, { message: "Selecione um morador" }),
});

type VisitorForm = z.infer<typeof visitorSchema>;

export const VisitorsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["visitors"],
    queryFn: async () => (await api.get<VisitorLog[]>("/visitors")).data,
    enabled: user?.role !== "MORADOR",
  });

  const { data: residents } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => (await api.get<Resident[]>("/auth/users")).data.filter((resident) => resident.role === "MORADOR"),
    enabled: user?.role !== "MORADOR",
  });

  const createForm = useForm<VisitorForm>({ resolver: zodResolver(visitorSchema) });

  const createMutation = useMutation({
    mutationFn: async (payload: VisitorForm) => (await api.post("/visitors", payload)).data,
    onSuccess: () => {
      toast.success("Entrada registrada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
      createForm.reset();
    },
    onError: () => toast.error("Não foi possível registrar a entrada"),
  });

  const exitMutation = useMutation({
    mutationFn: async (logId: string) => (await api.post(`/visitors/${logId}/exit`, {})).data,
    onSuccess: () => {
      toast.success("Saída confirmada");
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
    },
    onError: () => toast.error("Não foi possível confirmar a saída"),
  });

  if (user?.role === "MORADOR") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso não permitido</CardTitle>
          <CardDescription>Somente porteiros e administradores podem gerenciar visitantes.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Controle de visitantes</h2>
          <p className="text-sm text-muted-foreground">Registro rápido de entradas e saídas no condomínio.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5" /> Nova entrada
          </CardTitle>
          <CardDescription>Cadastre visitantes informando morador anfitrião e motivo da visita.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="João Pereira" {...createForm.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">Documento</Label>
              <Input id="document" placeholder="CPF ou RG" {...createForm.register("document")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 98888-7777" {...createForm.register("phone")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="visitReason">Motivo</Label>
              <Input id="visitReason" placeholder="Entrega, visita, manutenção..." {...createForm.register("visitReason")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostId">Morador anfitrião</Label>
              <select
                id="hostId"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...createForm.register("hostId")}
              >
                <option value="">Selecione</option>
                {residents?.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.name} • {resident.apartment ?? "Sem apto"}
                  </option>
                ))}
              </select>
              {createForm.formState.errors.hostId && (
                <p className="text-sm text-destructive">{createForm.formState.errors.hostId.message}</p>
              )}
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Registrando..." : "Registrar entrada"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visitantes no condomínio</CardTitle>
          <CardDescription>Acompanhe o status de cada visita.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitante</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Morador</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.visitor.name}</TableCell>
                  <TableCell>{log.visitor.document}</TableCell>
                  <TableCell>{log.host.name}</TableCell>
                  <TableCell>{format(new Date(log.entryTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                  <TableCell>
                    {log.exitTime ? (
                      <Badge variant="secondary">Saiu {format(new Date(log.exitTime), "HH:mm", { locale: ptBR })}</Badge>
                    ) : (
                      <Badge>Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!log.exitTime && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => exitMutation.mutate(log.id)}
                        disabled={exitMutation.isPending}
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Registrar saída
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && logs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma visita registrada hoje.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
